import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UpdateNotificationTemplateDto } from "../dto/notification-template.dto";

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
      data: dto,
    });
  }

  async create(eventType: string, title: string, body: string) {
    return this.prisma.notificationTemplate.create({
      data: { eventType, title, body },
    });
  }
}
