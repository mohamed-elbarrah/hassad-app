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

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
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
}
