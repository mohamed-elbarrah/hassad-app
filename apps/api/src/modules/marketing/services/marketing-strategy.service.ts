import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { MarketingStrategyStatus, TaskDepartment } from "@hassad/shared";

const STRATEGY_STATUS_AR: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "تم الإرسال",
  APPROVED: "تمت الموافقة",
  REVISION_REQUESTED: "مطلوب تعديل",
  REJECTED: "مرفوض",
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
      throw new NotFoundException("المهمة غير موجودة");
    }

    if (task.department?.name !== TaskDepartment.MARKETING) {
      throw new BadRequestException("يجب أن تكون المهمة من نوع تسويق");
    }

    if (task.assignedTo !== userId) {
      throw new BadRequestException(
        "يجب أن تكون المسوق المسند إليه المهمة لإنشاء دراسة تسويقية",
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
      throw new BadRequestException(
        "يوجد دراسة تسويقية نشطة لهذه المهمة بالفعل",
      );
    }

    if (!task.project?.clientId) {
      throw new BadRequestException("المهمة غير مرتبطة بمشروع أو عميل");
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
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    if (strategy.createdBy !== userId) {
      throw new BadRequestException("يمكن فقط لمنشئ الدراسة إرسالها");
    }

    if (
      strategy.status !== MarketingStrategyStatus.DRAFT &&
      strategy.status !== MarketingStrategyStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `لا يمكن إرسال الدراسة في الحالة الحالية: ${STRATEGY_STATUS_AR[strategy.status] ?? strategy.status}`,
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
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_SENT",
          userId: client.userId,
          title: "دراسة تسويقية جديدة",
          body: `تم إرسال دراسة تسويقية جديدة للمهمة "${strategy.task.title}" بانتظار مراجعتك`,
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
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_SENT",
          userId: strategy.task.createdBy,
          title: "تم إرسال الدراسة التسويقية",
          body: `تم إرسال الدراسة التسويقية للمهمة "${strategy.task.title}" إلى العميل`,
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
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);

    if (strategy.status !== MarketingStrategyStatus.SENT) {
      throw new BadRequestException(
        "يمكن الموافقة على الدراسة فقط عندما تكون في حالة الإرسال",
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
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_APPROVED",
          userId: recipientId,
          title: "تمت الموافقة على الدراسة التسويقية",
          body: `تمت الموافقة على الدراسة التسويقية للمهمة "${strategy.task.title}" — يمكن الآن إنشاء الحملات`,
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
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);

    if (strategy.status !== MarketingStrategyStatus.SENT) {
      throw new BadRequestException(
        "يمكن طلب تعديل على الدراسة فقط عندما تكون في حالة الإرسال",
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
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_REVISION_REQUESTED",
          userId: recipientId,
          title: "طلب تعديل على الدراسة التسويقية",
          body: `طلب العميل تعديل الدراسة التسويقية للمهمة "${strategy.task.title}": ${comment}`,
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
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    await this.verifyClientOwnsStrategy(strategy.clientId, clientUserId);

    if (strategy.status !== MarketingStrategyStatus.SENT) {
      throw new BadRequestException(
        "يمكن رفض الدراسة فقط عندما تكون في حالة الإرسال",
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
        .createNotification({
          entityId: id,
          entityType: "marketing_strategy",
          eventType: "MARKETING_STRATEGY_REJECTED",
          userId: recipientId,
          title: "تم رفض الدراسة التسويقية",
          body: `رفض العميل الدراسة التسويقية للمهمة "${strategy.task.title}"`,
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
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    if (strategy.createdBy !== userId) {
      throw new BadRequestException("يمكن فقط لمنشئ الدراسة إعادة إرسالها");
    }

    if (strategy.status !== MarketingStrategyStatus.REVISION_REQUESTED) {
      throw new BadRequestException(
        "يمكن إعادة إرسال الدراسة فقط عندما تكون في حالة طلب تعديل",
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
        .notifyUsers({
          userIds: resubmitRecipients,
          title: "دراسة تسويقية مُعدّلة",
          message: "تم إعادة إرسال الدراسة التسويقية المُعدّلة بانتظار مراجعتك",
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
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    return strategy;
  }

  async getDownloadUrl(id: string): Promise<string> {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      select: { filePath: true },
    });

    if (!strategy) {
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
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
      throw new BadRequestException("غير مصرح بهذا الإجراء");
    }
  }
}
