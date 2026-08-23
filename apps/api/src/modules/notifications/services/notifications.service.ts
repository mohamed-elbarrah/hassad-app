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

  /** Broadcast invalidations to client's WebSocket connections (NEW) */
  async broadcastPortalInvalidations(clientId: string, tags: string[]) {
    this.eventEmitter.emit("socket.broadcast", {
      type: "INVALIDATE_TAGS",
      payload: { tags, clientId },
    });
  }

  private normalizeEntityType(entityType: string): string {
    return entityType.trim().toLowerCase();
  }

  private async emitUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    this.eventEmitter.emit("notification.unreadCount", { userId, count });
  }

  private mapNotificationRow(row: {
    id: string;
    userId: string;
    isRead: boolean;
    channel: string;
    sentAt: Date | null;
    readAt: Date | null;
    event: {
      entityId: string;
      entityType: string;
      eventType: string;
      metadata: Prisma.JsonValue | null;
    };
  }) {
    const createdAt = row.sentAt ?? row.readAt ?? new Date();

    return {
      id: row.id,
      userId: row.userId,
      isRead: row.isRead,
      channel: row.channel,
      sentAt: row.sentAt,
      readAt: row.readAt,
      createdAt,
      entityId: row.event.entityId,
      entityType: row.event.entityType,
      eventType: row.event.eventType,
      metadata: row.event.metadata,
    };
  }

  async createNotification(params: {
    entityId: string;
    entityType: string;
    eventType: string;
    userId: string;
    /** @deprecated Use eventType and metadata. */
    title?: string;
    /** @deprecated Use eventType and metadata. */
    body?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const notification = await this.prisma.$transaction(async (tx) => {
      const event = await tx.notificationEvent.create({
        data: {
          entityId: params.entityId,
          entityType: this.normalizeEntityType(params.entityType),
          eventType: params.eventType.trim(),
          metadata: params.metadata ?? undefined,
        },
      });

      const notif = await tx.notification.create({
        data: {
          eventId: event.id,
          userId: params.userId,
          channel: "in-app",
          sentAt: new Date(),
        },
      });

      return notif;
    });

    this.eventEmitter.emit("notification.created", {
      id: notification.id,
      userId: notification.userId,
      isRead: notification.isRead,
      createdAt: notification.sentAt,
      entityId: params.entityId,
      entityType: this.normalizeEntityType(params.entityType),
      eventType: params.eventType.trim(),
      metadata: params.metadata ?? null,
    });

    await this.emitUnreadCount(params.userId);

    return notification;
  }

  async findAll(
    userId: string,
    filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
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
              metadata: true,
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
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    await this.emitUnreadCount(userId);
    return result;
  }

  async markRead(userId: string, notificationIds: string[]) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        id: { in: notificationIds },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    await this.emitUnreadCount(userId);
    return result;
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    await this.emitUnreadCount(userId);
    return result;
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
          metadata: { title: params.title, body: params.message },
        },
      });

      await tx.notification.createMany({
        data: users.map((u) => ({
          eventId: event.id,
          userId: u.id,
          channel: "in-app",
          sentAt: new Date(),
        })),
      });

      return { sent: users.length };
    });

    const userIds = users.map((user) => user.id);
    this.eventEmitter.emit("notification.broadcast", {
      userIds,
      metadata: { title: params.title, body: params.message },
    });

    await Promise.all(
      userIds.map(async (userId) => {
        const count = await this.prisma.notification.count({
          where: { userId, isRead: false },
        });
        this.eventEmitter.emit("notification.unreadCount", { userId, count });
      }),
    );

    return result;
  }

  async notifyUsers(params: {
    userIds: string[];
    excludeUserIds?: string[];
    /** @deprecated Use eventType and metadata. */
    title?: string;
    /** @deprecated Use metadata for system notification content. */
    message?: string;
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
          entityType: this.normalizeEntityType(params.entityType || "system"),
          eventType: params.eventType?.trim() || "DIRECT_NOTIFICATION",
          metadata: params.metadata ?? undefined,
        },
      });

      const notifications = await tx.notification.createManyAndReturn({
        data: uniqueUserIds.map((userId) => ({
          eventId: event.id,
          userId,
          channel: "in-app",
          sentAt: new Date(),
        })),
        select: { id: true, userId: true, isRead: true, sentAt: true },
      });

      return { sent: uniqueUserIds.length, notifications };
    });

    for (const userId of uniqueUserIds) {
      const notification = result.notifications.find(
        (item) => item.userId === userId,
      );
      this.eventEmitter.emit("notification.created", {
        id: notification?.id,
        userId,
        isRead: notification?.isRead ?? false,
        createdAt: notification?.sentAt ?? new Date(),
        entityId: params.entityId || "system",
        entityType: this.normalizeEntityType(params.entityType || "system"),
        eventType: params.eventType?.trim() || "DIRECT_NOTIFICATION",
        metadata: params.metadata ?? null,
      });

      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });
      this.eventEmitter.emit("notification.unreadCount", {
        userId,
        count: unreadCount,
      });
    }

    return result;
  }
}
