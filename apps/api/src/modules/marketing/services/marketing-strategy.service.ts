import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ApiException } from "../../../common/errors/api-error";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { MarketingStrategyStatus, TaskDepartment } from "@hassad/shared";

const STRATEGY_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  APPROVED: "Approved",
  REVISION_REQUESTED: "Revision requested",
  REJECTED: "Rejected",
};

@Injectable()
export class MarketingStrategyService {
  private readonly logger = new Logger(MarketingStrategyService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private storageService: StorageService,
  ) {}

  async create(
    taskId: string,
    file: { key: string; originalName: string; size: number; mimeType: string },
    userId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        department: true,
        project: { select: { clientId: true, id: true } },
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (task.department?.name !== TaskDepartment.MARKETING) {
      throw new ApiException("STRATEGY_MARKETING_TASK_REQUIRED", "Task must be a marketing task", 400);
    }

    if (task.assignedTo !== userId) {
      throw new ApiException(
        "STRATEGY_ASSIGNEE_REQUIRED",
        "A marketing assignee is required to create a marketing strategy",
        400,
      );
    }

    // Check if task already has an active (non-rejected) strategy
    const existingActive = await this.prisma.marketingStrategy.findFirst({
      where: {
        taskId,
        status: {
          in: [
            MarketingStrategyStatus.DRAFT,
            MarketingStrategyStatus.SENT,
            MarketingStrategyStatus.APPROVED,
          ],
        },
      },
    });

    if (existingActive) {
      throw new ApiException(
        "STRATEGY_ALREADY_ACTIVE",
        "An active marketing strategy already exists for this task",
        409,
      );
    }

    if (!task.project?.clientId) {
      throw new ApiException("STRATEGY_CONTEXT_MISSING", "Task is not linked to a project or client", 400);
    }

    const strategy = await this.prisma.marketingStrategy.create({
      data: {
        taskId,
        createdBy: userId,
        clientId: task.project.clientId,
        projectId: task.project.id,
        fileName: file.originalName,
        filePath: file.key,
        fileSize: file.size,
        fileType: file.mimeType,
        status: MarketingStrategyStatus.DRAFT,
      },
    });

    return strategy;
  }

  async sendToClient(id: string, userId: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: { select: { title: true, createdBy: true, assignedTo: true } },
      },
    });

    if (!strategy) {
      throw new NotFoundException("Marketing strategy not found");
    }

    if (strategy.createdBy !== userId) {
      throw new ApiException("STRATEGY_CREATOR_REQUIRED", "Only the strategy creator can send it", 403);
    }

    if (
      strategy.status !== MarketingStrategyStatus.DRAFT &&
      strategy.status !== MarketingStrategyStatus.REVISION_REQUESTED
    ) {
      throw new ApiException(
        "STRATEGY_INVALID_SEND_STATUS",
        `The strategy cannot be sent in its current state: ${STRATEGY_STATUS_LABELS[strategy.status] ?? strategy.status}`,
        400,
      );
    }

    const updated = await this.prisma.marketingStrategy.update({
      where: { id },
      data: {
        status: MarketingStrategyStatus.SENT,
        sentAt: new Date(),
      },
    });

    // Notify client
    const client = await this.prisma.client.findUnique({
      where: { id: strategy.clientId },
      select: { userId: true },
    });

    if (client?.userId) {
      await this.notifications
        .createLocalizedNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_SENT",
          userId: client.userId,
          messageKey: "strategy.submitted",
          messageParams: { taskTitle: strategy.task.title }
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify client about strategy ${id}`,
            err,
          ),
        );
    }

    // Notify PM
    if (strategy.task.createdBy) {
      await this.notifications
        .createLocalizedNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_SENT",
          userId: strategy.task.createdBy,
          messageKey: "strategy.sent",
          messageParams: { taskTitle: strategy.task.title }
        })
        .catch((err) =>
          this.logger.error(`Failed to notify PM about strategy ${id}`, err),
        );
    }

    return updated;
  }

  async approve(id: string, clientUserId: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: { select: { title: true, createdBy: true, assignedTo: true } },
      },
    });

    if (!strategy) {
      throw new NotFoundException("Marketing strategy not found");
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);

    if (strategy.status !== MarketingStrategyStatus.SENT) {
      throw new ApiException(
        "STRATEGY_INVALID_APPROVAL_STATUS",
        "The strategy can only be approved when it is in the sent state",
        400,
      );
    }

    const updated = await this.prisma.marketingStrategy.update({
      where: { id },
      data: {
        status: MarketingStrategyStatus.APPROVED,
        approvedBy: clientUserId,
        approvedAt: new Date(),
      },
    });

    // Notify marketer & PM
    const recipients = [
      strategy.task.assignedTo,
      strategy.task.createdBy,
    ].filter(Boolean) as string[];

    for (const recipientId of recipients) {
      await this.notifications
        .createLocalizedNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_APPROVED",
          userId: recipientId,
          messageKey: "strategy.approved",
          messageParams: { taskTitle: strategy.task.title }
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify about strategy approval ${id}`,
            err,
          ),
        );
    }

    return updated;
  }

  async requestRevision(id: string, clientUserId: string, comment: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: { select: { title: true, createdBy: true, assignedTo: true } },
      },
    });

    if (!strategy) {
      throw new NotFoundException("Marketing strategy not found");
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);

    if (strategy.status !== MarketingStrategyStatus.SENT) {
      throw new ApiException(
        "STRATEGY_INVALID_REVISION_STATUS",
        "A revision can only be requested when the strategy is in the sent state",
        400,
      );
    }

    const updated = await this.prisma.marketingStrategy.update({
      where: { id },
      data: {
        status: MarketingStrategyStatus.REVISION_REQUESTED,
        revisionNote: comment,
      },
    });

    // Notify marketer & PM
    const recipients = [
      strategy.task.assignedTo,
      strategy.task.createdBy,
    ].filter(Boolean) as string[];

    for (const recipientId of recipients) {
      await this.notifications
        .createLocalizedNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_REVISION_REQUESTED",
          userId: recipientId,
          messageKey: "strategy.revision_requested",
          messageParams: { taskTitle: strategy.task.title, comment }
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify about strategy revision ${id}`,
            err,
          ),
        );
    }

    return updated;
  }

  async reject(id: string, clientUserId: string, reason?: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: { select: { title: true, createdBy: true, assignedTo: true } },
      },
    });

    if (!strategy) {
      throw new NotFoundException("Marketing strategy not found");
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);

    if (strategy.status !== MarketingStrategyStatus.SENT) {
      throw new ApiException(
        "STRATEGY_INVALID_REJECTION_STATUS",
        "The strategy can only be rejected when it is in the sent state",
        400,
      );
    }

    const updated = await this.prisma.marketingStrategy.update({
      where: { id },
      data: {
        status: MarketingStrategyStatus.REJECTED,
        revisionNote: reason ?? null,
      },
    });

    // Notify marketer & PM
    const recipients = [
      strategy.task.assignedTo,
      strategy.task.createdBy,
    ].filter(Boolean) as string[];

    for (const recipientId of recipients) {
      await this.notifications
        .createLocalizedNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_REJECTED",
          userId: recipientId,
          messageKey: "strategy.rejected",
          messageParams: { taskTitle: strategy.task.title }
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify about strategy rejection ${id}`,
            err,
          ),
        );
    }

    return updated;
  }

  async resubmit(
    id: string,
    file: { key: string; originalName: string; size: number; mimeType: string },
    userId: string,
  ) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: { task: { select: { createdBy: true } } },
    });

    if (!strategy) {
      throw new NotFoundException("Marketing strategy not found");
    }

    if (strategy.createdBy !== userId) {
      throw new ApiException("STRATEGY_CREATOR_REQUIRED", "Only the strategy creator can resubmit it", 403);
    }

    if (strategy.status !== MarketingStrategyStatus.REVISION_REQUESTED) {
      throw new ApiException(
        "STRATEGY_INVALID_RESUBMIT_STATUS",
        "The strategy can only be resubmitted when revision was requested",
        400,
      );
    }

    const updated = await this.prisma.marketingStrategy.update({
      where: { id },
      data: {
        fileName: file.originalName,
        filePath: file.key,
        fileSize: file.size,
        fileType: file.mimeType,
        status: MarketingStrategyStatus.SENT,
        sentAt: new Date(),
        revisionNote: null,
      },
    });

    // Notify client
    const client = await this.prisma.client.findUnique({
      where: { id: strategy.clientId },
      select: { userId: true },
    });

    const pmId = strategy.task?.createdBy;
    const resubmitRecipients = [client?.userId, pmId].filter(Boolean) as string[];

    if (resubmitRecipients.length > 0) {
      await this.notifications
        .notifyUsersWithMessage({
          userIds: resubmitRecipients,
          messageKey: "strategy.revised",
          messageParams: {},
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_SENT",
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify about resubmit ${id}`,
            err,
          ),
        );
    }

    return updated;
  }

  async findByTask(taskId: string) {
    const strategies = await this.prisma.marketingStrategy.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return strategies.length > 0 ? strategies[0] : null;
  }

  async findByClient(
    clientId: string,
    query?: { status?: MarketingStrategyStatus },
  ) {
    const where: any = { clientId };
    if (query?.status) where.status = query.status;

    return this.prisma.marketingStrategy.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        creator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    if (!strategy) {
      throw new NotFoundException("Marketing strategy not found");
    }

    return strategy;
  }

  async getDownloadUrl(id: string): Promise<string> {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      select: { filePath: true },
    });

    if (!strategy) {
      throw new NotFoundException("Marketing strategy not found");
    }

    return this.storageService.getPresignedUrl(strategy.filePath);
  }

  async findAll(query: {
    status?: MarketingStrategyStatus;
    taskId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.taskId) where.taskId = query.taskId;

    const [data, total] = await Promise.all([
      this.prisma.marketingStrategy.findMany({
        where,
        include: {
          task: { select: { id: true, title: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marketingStrategy.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  private async verifyClientOwnsStrategy(
    clientId: string,
    clientUserId: string,
  ) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });

    if (!client?.userId || client.userId !== clientUserId) {
      throw new ApiException("STRATEGY_ACTION_NOT_AUTHORIZED", "This action is not authorized", 403);
    }
  }
}
