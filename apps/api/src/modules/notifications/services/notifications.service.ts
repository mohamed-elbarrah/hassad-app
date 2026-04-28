import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.notification.create({
      data: {
        eventId: event.id,
        userId: params.userId,
        title: params.title,
        body: params.body,
        channel: 'in-app',
        sentAt: new Date(),
      },
    });
  }

  async findAll(
    userId: string,
    filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = { userId };
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead === true || (filters.isRead as any) === 'true';
    }

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, total, page, limit, unreadCount };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markOneRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markRead(userId: string, notificationIds: string[]) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        id: { in: notificationIds },
      },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async broadcast(params: {
    title: string;
    message: string;
    roles?: string[];
    departments?: string[];
  }) {
    // Find target users based on roles and/or departments
    const where: any = { isActive: true };
    if (params.roles && params.roles.length > 0) {
      where.role = { name: { in: params.roles } };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    // Create a shared event
    const event = await this.prisma.notificationEvent.create({
      data: {
        entityId: 'broadcast',
        entityType: 'system',
        eventType: 'BROADCAST',
      },
    });

    // Create notifications for all target users
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        eventId: event.id,
        userId: u.id,
        title: params.title,
        body: params.message,
        channel: 'in-app',
        sentAt: new Date(),
      })),
    });

    return { sent: users.length };
  }
}
