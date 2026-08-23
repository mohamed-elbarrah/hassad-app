import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UpdateNotificationTemplateDto } from "../dto/notification-template.dto";
import type { Prisma } from "@prisma/client";

@Injectable()
export class NotificationTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException("قالب الإشعار غير موجود");
    return template;
  }

  async findByEventType(eventType: string) {
    return this.prisma.notificationTemplate.findUnique({
      where: { eventType },
    });
  }

  async update(id: string, dto: UpdateNotificationTemplateDto) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException("قالب الإشعار غير موجود");

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.translationKey !== undefined
          ? { translationKey: dto.translationKey }
          : {}),
        ...(dto.metadataSchema !== undefined
          ? { metadataSchema: dto.metadataSchema as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async create(
    eventType: string,
    title: string,
    body: string,
    translationKey?: string,
    metadataSchema?: Record<string, unknown>,
  ) {
    return this.prisma.notificationTemplate.create({
      data: {
        eventType,
        title,
        body,
        translationKey,
        metadataSchema: metadataSchema as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
