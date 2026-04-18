import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { UserRole, TaskDepartment } from "@hassad/shared";
import { PrismaService } from "../prisma/prisma.service";
import { GetNotificationsDto } from "./dto/get-notifications.dto";
import { BroadcastNotificationDto } from "./dto/broadcast-notification.dto";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotification(input: CreateNotificationInput): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityId: input.entityId,
        entityType: input.entityType,
      },
      select: { id: true, userId: true, type: true },
    });

    await this.dispatchNotification(notification);
  }

  async dispatchNotification(notification: {
    id: string;
    userId: string;
    type: NotificationType;
  }): Promise<void> {
    this.logger.log(
      `Dispatching notification [${notification.type}] to user ${notification.userId} (id: ${notification.id})`,
    );
    // Future hooks:
    // await this.dispatchViaWebSocket(notification);
    // await this.dispatchViaEmail(notification);
    // await this.dispatchViaWhatsApp(notification);
  }

  async getMyNotifications(userId: string, dto: GetNotificationsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: {
      userId: string;
      isRead?: boolean;
    } = { userId };

    if (dto.isRead !== undefined) {
      where.isRead = dto.isRead;
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          entityId: true,
          entityType: true,
          isRead: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, total, page, limit, unreadCount };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        "You can only mark your own notifications as read",
      );
    }

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async broadcast(dto: BroadcastNotificationDto): Promise<{ sent: number }> {
    const hasRoleFilter = dto.roles && dto.roles.length > 0;
    const hasDeptFilter = dto.departments && dto.departments.length > 0;

    const where: {
      isActive: boolean;
      OR?: Array<{
        role?: { in: UserRole[] };
        department?: { in: TaskDepartment[] };
      }>;
    } = { isActive: true };

    if (hasRoleFilter || hasDeptFilter) {
      const orConditions: Array<{
        role?: { in: UserRole[] };
        department?: { in: TaskDepartment[] };
      }> = [];

      if (hasRoleFilter && dto.roles) {
        orConditions.push({ role: { in: dto.roles } });
      }
      if (hasDeptFilter && dto.departments) {
        orConditions.push({ department: { in: dto.departments } });
      }
      where.OR = orConditions;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      return { sent: 0 };
    }

    const notifications = users.map((user) => ({
      userId: user.id,
      type: NotificationType.ADMIN_BROADCAST,
      title: dto.title,
      message: dto.message,
    }));

    const BATCH_SIZE = 1000;
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      await this.prisma.notification.createMany({
        data: notifications.slice(i, i + BATCH_SIZE),
      });
    }

    this.logger.log(
      `Broadcast notification "${dto.title}" sent to ${users.length} users`,
    );

    return { sent: users.length };
  }
}
