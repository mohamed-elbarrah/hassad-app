import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private mapNotificationRow(row: {
    id: string;
    userId: string;
    title: string;
    body: string;
    isRead: boolean;
    channel: string;
    sentAt: Date | null;
    readAt: Date | null;
    event: { entityId: string; entityType: string; eventType: string };
  }) {
    const createdAt = row.sentAt ?? row.readAt ?? new Date();

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      body: row.body,
      isRead: row.isRead,
      channel: row.channel,
      sentAt: row.sentAt,
      readAt: row.readAt,
      createdAt,
      entityId: row.event.entityId,
      entityType: row.event.entityType,
      eventType: row.event.eventType,
    };
  }

  async createNotification(params: {
    entityId: string;
    entityType: string;
    eventType: string;
    userId: string;
    title: string;
    body: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const event = await this.prisma.notificationEvent.create({
      data: {
        entityId: params.entityId,
        entityType: params.entityType,
        eventType: params.eventType,
        metadata: params.metadata ?? undefined,
      },
    });

    const notification = await this.prisma.notification.create({
      data: {
        eventId: event.id,
        userId: params.userId,
        title: params.title,
        body: params.body,
        channel: "in-app",
        sentAt: new Date(),
      },
    });

    this.eventEmitter.emit("notification.created", {
      ...notification,
      entityId: params.entityId,
      entityType: params.entityType,
      eventType: params.eventType,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId: params.userId, isRead: false },
    });
    this.eventEmitter.emit("notification.unreadCount", {
      userId: params.userId,
      count: unreadCount,
    });

    return notification;
  }

  async findAll(
    userId: string,
    filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = { userId };
    if (filters.isRead !== undefined) {
      where.isRead =
        filters.isRead === true || (filters.isRead as any) === "true";
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          event: {
            select: {
              entityId: true,
              entityType: true,
              eventType: true,
            },
          },
        },
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: data.map((item) => this.mapNotificationRow(item)),
      total,
      page,
      limit,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markOneRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markRead(userId: string, notificationIds: string[]) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        id: { in: notificationIds },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async broadcast(params: {
    title: string;
    message: string;
    roles?: string[];
    departments?: string[];
  }) {
    // Find target users based on roles and/or departments
    const where: Prisma.UserWhereInput = { isActive: true };
    if (params.roles && params.roles.length > 0) {
      where.role = { name: { in: params.roles } };
    }
    if (params.departments && params.departments.length > 0) {
      where.departments = {
        some: {
          department: {
            name: { in: params.departments },
          },
        },
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      return { sent: 0 };
    }

    // Create event + notifications in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.notificationEvent.create({
        data: {
          entityId: "broadcast",
          entityType: "system",
          eventType: "BROADCAST",
        },
      });

      await tx.notification.createMany({
        data: users.map((u) => ({
          eventId: event.id,
          userId: u.id,
          title: params.title,
          body: params.message,
          channel: "in-app",
          sentAt: new Date(),
        })),
      });

      return { sent: users.length };
    });

    this.eventEmitter.emit("notification.broadcast", {
      title: params.title,
      message: params.message,
    });

    return result;
  }

  async notifyUsers(params: {
    userIds: string[];
    excludeUserIds?: string[];
    title: string;
    message: string;
    entityId?: string;
    entityType?: string;
    eventType?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const finalUserIds = params.excludeUserIds
      ? params.userIds.filter((id) => !params.excludeUserIds.includes(id))
      : params.userIds;

    const uniqueUserIds = [...new Set(finalUserIds)];

    if (uniqueUserIds.length === 0) {
      return { sent: 0 };
    }

    // Create event + notifications in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.notificationEvent.create({
        data: {
          entityId: params.entityId || "system",
          entityType: params.entityType || "system",
          eventType: params.eventType || "DIRECT_NOTIFICATION",
          metadata: params.metadata ?? undefined,
        },
      });

      await tx.notification.createMany({
        data: uniqueUserIds.map((userId) => ({
          eventId: event.id,
          userId,
          title: params.title,
          body: params.message,
          channel: "in-app",
          sentAt: new Date(),
        })),
      });

      return { sent: uniqueUserIds.length };
    });

    for (const userId of uniqueUserIds) {
      this.eventEmitter.emit("notification.created", {
        userId,
        title: params.title,
        body: params.message,
        entityId: params.entityId || "system",
        entityType: params.entityType || "system",
        eventType: params.eventType || "DIRECT_NOTIFICATION",
      });

      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });
      this.eventEmitter.emit("notification.unreadCount", { userId, count: unreadCount });
    }

    return result;
  }
}

