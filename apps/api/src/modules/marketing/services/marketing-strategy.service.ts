import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { MarketingStrategyStatus, TaskDepartment } from "@hassad/shared";

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
      throw new NotFoundException({
        code: "MARKETING_TASK_NOT_FOUND",
        details: {},
      });
    }

    if (task.department?.name !== TaskDepartment.MARKETING) {
      throw new BadRequestException({
        code: "MARKETING_TASK_DEPARTMENT_REQUIRED",
        details: {},
      });
    }

    if (task.assignedTo !== userId) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_OWNER_REQUIRED",
        details: {},
      });
    }

    // Check if task already has an active (non-rejected) strategy
    const existingActive = await this.prisma.marketingStrategy.findFirst({
      where: {
        taskId,
        status: {
          in: [
            MarketingStrategyStatus.DRAFT,
            MarketingStrategyStatus.PM_REVIEW,
            MarketingStrategyStatus.PM_REVISION_REQUESTED,
            MarketingStrategyStatus.CLIENT_REVIEW,
            MarketingStrategyStatus.CLIENT_REVISION_REQUESTED,
            MarketingStrategyStatus.SENT,
            MarketingStrategyStatus.APPROVED,
          ],
        },
      },
    });

    if (existingActive) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_ALREADY_EXISTS",
        details: {},
      });
    }

    if (!task.project?.clientId) {
      throw new BadRequestException({
        code: "MARKETING_TASK_CLIENT_REQUIRED",
        details: {},
      });
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

  async submitForPm(id: string, userId: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            title: true,
            createdBy: true,
            assignedTo: true,
            project: { select: { projectManagerId: true } },
          },
        },
      },
    });

    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    if (strategy.createdBy !== userId) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_OWNER_REQUIRED",
        details: {},
      });
    }

    if (
      strategy.status !== MarketingStrategyStatus.DRAFT &&
      strategy.status !== MarketingStrategyStatus.CLIENT_REVISION_REQUESTED &&
      strategy.status !== MarketingStrategyStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.marketingStrategy.update({
        where: { id },
        data: {
          status: MarketingStrategyStatus.PM_REVIEW,
          submittedAt: new Date(),
          isVisibleToClient: false,
        },
      });
      await tx.marketingStrategyReviewHistory.create({
        data: {
          strategyId: strategy.id,
          fromStatus: strategy.status,
          toStatus: MarketingStrategyStatus.PM_REVIEW,
          actorId: userId,
          actorRole: "MARKETING",
        },
      });
      return result;
    });

    if (strategy.task.project?.projectManagerId) {
      await this.notifications
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_SUBMITTED_FOR_PM_REVIEW",
          metadata: { taskId: strategy.taskId, projectId: strategy.projectId },
          userId: strategy.task.project.projectManagerId,
        })
        .catch((err) =>
          this.logger.error(`Failed to notify PM about strategy ${id}`, err),
        );
    }

    return updated;
  }

  async approveForClient(id: string, pmUserId: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            project: { select: { projectManagerId: true } },
          },
        },
      },
    });
    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }
    if (strategy.task.project?.projectManagerId !== pmUserId) {
      throw new BadRequestException({ code: "PERMISSION_DENIED", details: {} });
    }
    if (strategy.status !== MarketingStrategyStatus.PM_REVIEW) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.marketingStrategy.update({
        where: { id },
        data: {
          status: MarketingStrategyStatus.CLIENT_REVIEW,
          sentAt: new Date(),
          pmReviewedBy: pmUserId,
          pmReviewedAt: new Date(),
          isVisibleToClient: true,
        },
      });
      await tx.marketingStrategyReviewHistory.create({
        data: {
          strategyId: strategy.id,
          fromStatus: strategy.status,
          toStatus: MarketingStrategyStatus.CLIENT_REVIEW,
          actorId: pmUserId,
          actorRole: "PM",
        },
      });
      return result;
    });

    const client = await this.prisma.client.findUnique({
      where: { id: strategy.clientId },
      select: { userId: true },
    });
    if (client?.userId) {
      await this.notifications
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_SENT",
          metadata: { taskId: strategy.taskId, projectId: strategy.projectId },
          userId: client.userId,
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify client about strategy ${id}`,
            err,
          ),
        );
    }
    return updated;
  }

  async requestPmRevision(id: string, pmUserId: string, comment: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            project: { select: { projectManagerId: true } },
          },
        },
      },
    });
    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }
    if (strategy.task.project?.projectManagerId !== pmUserId) {
      throw new BadRequestException({ code: "PERMISSION_DENIED", details: {} });
    }
    if (strategy.status !== MarketingStrategyStatus.PM_REVIEW) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.marketingStrategy.update({
        where: { id },
        data: {
          status: MarketingStrategyStatus.PM_REVISION_REQUESTED,
          revisionNote: comment,
          isVisibleToClient: false,
        },
      });
      await tx.marketingStrategyReviewHistory.create({
        data: {
          strategyId: strategy.id,
          fromStatus: strategy.status,
          toStatus: MarketingStrategyStatus.PM_REVISION_REQUESTED,
          actorId: pmUserId,
          actorRole: "PM",
          comment,
        },
      });
      return result;
    });
    if (strategy.createdBy) {
      await this.notifications
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_PM_REVISION_REQUESTED",
          metadata: { taskId: strategy.taskId, projectId: strategy.projectId },
          userId: strategy.createdBy,
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify Marketing about strategy ${id}`,
            err,
          ),
        );
    }
    return updated;
  }

  async approve(id: string, clientUserId: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            title: true,
            createdBy: true,
            assignedTo: true,
            isVisibleToClient: true,
          },
        },
      },
    });

    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);
    if (!strategy.isVisibleToClient) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_NOT_VISIBLE_TO_CLIENT",
        details: {},
      });
    }

    if (
      strategy.status !== MarketingStrategyStatus.CLIENT_REVIEW &&
      strategy.status !== MarketingStrategyStatus.SENT
    ) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.marketingStrategy.update({
        where: { id },
        data: {
          status: MarketingStrategyStatus.APPROVED,
          approvedBy: clientUserId,
          approvedAt: new Date(),
        },
      });
      await tx.marketingStrategyReviewHistory.create({
        data: {
          strategyId: strategy.id,
          fromStatus: strategy.status,
          toStatus: MarketingStrategyStatus.APPROVED,
          actorId: clientUserId,
          actorRole: "CLIENT",
        },
      });
      return result;
    });

    // Notify marketer & PM
    const recipients = Array.from(
      new Set(
        [strategy.task.assignedTo, strategy.task.createdBy].filter(
          Boolean,
        ) as string[],
      ),
    );

    for (const recipientId of recipients) {
      await this.notifications
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_APPROVED",
          metadata: { taskId: strategy.taskId, projectId: strategy.projectId },
          userId: recipientId,
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
        task: {
          select: {
            title: true,
            createdBy: true,
            assignedTo: true,
            isVisibleToClient: true,
          },
        },
      },
    });

    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);
    if (!strategy.isVisibleToClient) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_NOT_VISIBLE_TO_CLIENT",
        details: {},
      });
    }

    if (
      strategy.status !== MarketingStrategyStatus.CLIENT_REVIEW &&
      strategy.status !== MarketingStrategyStatus.SENT
    ) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.marketingStrategy.update({
        where: { id },
        data: {
          status: MarketingStrategyStatus.CLIENT_REVISION_REQUESTED,
          revisionNote: comment,
          isVisibleToClient: false,
        },
      });
      await tx.marketingStrategyReviewHistory.create({
        data: {
          strategyId: strategy.id,
          fromStatus: strategy.status,
          toStatus: MarketingStrategyStatus.CLIENT_REVISION_REQUESTED,
          actorId: clientUserId,
          actorRole: "CLIENT",
          comment,
        },
      });
      return result;
    });

    // Notify marketer & PM
    const recipients = Array.from(
      new Set(
        [strategy.task.assignedTo, strategy.task.createdBy].filter(
          Boolean,
        ) as string[],
      ),
    );

    for (const recipientId of recipients) {
      await this.notifications
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_REVISION_REQUESTED",
          metadata: { taskId: strategy.taskId, projectId: strategy.projectId },
          userId: recipientId,
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
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);

    if (
      strategy.status !== MarketingStrategyStatus.CLIENT_REVIEW &&
      strategy.status !== MarketingStrategyStatus.SENT
    ) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.marketingStrategy.update({
        where: { id },
        data: {
          status: MarketingStrategyStatus.REJECTED,
          revisionNote: reason ?? null,
          isVisibleToClient: false,
        },
      });
      await tx.marketingStrategyReviewHistory.create({
        data: {
          strategyId: strategy.id,
          fromStatus: strategy.status,
          toStatus: MarketingStrategyStatus.REJECTED,
          actorId: clientUserId,
          actorRole: "CLIENT",
          comment: reason,
        },
      });
      return result;
    });

    // Notify marketer & PM
    const recipients = [
      strategy.task.assignedTo,
      strategy.task.createdBy,
    ].filter(Boolean) as string[];

    for (const recipientId of recipients) {
      await this.notifications
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_REJECTED",
          metadata: { taskId: strategy.taskId, projectId: strategy.projectId },
          userId: recipientId,
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
    });

    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    if (strategy.createdBy !== userId) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_OWNER_REQUIRED",
        details: {},
      });
    }

    if (
      strategy.status !== MarketingStrategyStatus.PM_REVISION_REQUESTED &&
      strategy.status !== MarketingStrategyStatus.CLIENT_REVISION_REQUESTED &&
      strategy.status !== MarketingStrategyStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.marketingStrategy.update({
        where: { id },
        data: {
          fileName: file.originalName,
          filePath: file.key,
          fileSize: file.size,
          fileType: file.mimeType,
          status: MarketingStrategyStatus.DRAFT,
          revisionNote: null,
          isVisibleToClient: false,
        },
      });
      await tx.marketingStrategyReviewHistory.create({
        data: {
          strategyId: strategy.id,
          fromStatus: strategy.status,
          toStatus: MarketingStrategyStatus.DRAFT,
          actorId: userId,
          actorRole: "MARKETING",
        },
      });
      return result;
    });

    if (strategy.filePath !== file.key) {
      await this.storageService.deleteByKey(strategy.filePath).catch(() => {});
    }

    return updated;
  }

  async findByTask(taskId: string, userId?: string) {
    const strategies = await this.prisma.marketingStrategy.findMany({
      where: {
        taskId,
        ...(userId ? { task: { assignedTo: userId } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return strategies.length > 0 ? strategies[0] : null;
  }

  async findByClient(
    clientId: string,
    query?: { status?: MarketingStrategyStatus },
  ) {
    const where: Prisma.MarketingStrategyWhereInput = { clientId };
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

  async findOne(id: string, userId?: string) {
    const strategy = await this.prisma.marketingStrategy.findFirst({
      where: {
        id,
        ...(userId ? { task: { assignedTo: userId } } : {}),
      },
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
        reviewHistory: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    return strategy;
  }

  async getDownloadUrl(id: string, userId?: string): Promise<string> {
    const strategy = await this.prisma.marketingStrategy.findFirst({
      where: {
        id,
        ...(userId ? { task: { assignedTo: userId } } : {}),
      },
      select: { filePath: true },
    });

    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
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
    const where: Prisma.MarketingStrategyWhereInput = {};

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
      throw new BadRequestException({ code: "PERMISSION_DENIED", details: {} });
    }
  }
}
