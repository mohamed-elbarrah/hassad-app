import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { UpdateNotificationTemplateDto } from "../dto/admin-notification-templates.dto";

@Injectable()
export class AdminNotificationTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async audit(
    action: string,
    entity: string,
    entityId: string,
    userId?: string,
    before?: any,
    after?: any,
  ) {
    await this.prisma.ledger.create({
      data: { action, entity, entityId, userId, before, after },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notificationTemplate.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException("Template not found");
    return template;
  }

  async update(
    id: string,
    dto: UpdateNotificationTemplateDto,
    userId?: string,
  ) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException("Template not found");

    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.audit(
      "ADMIN_UPDATE_NOTIFICATION_TEMPLATE",
      "NotificationTemplate",
      id,
      userId,
      { title: template.title, isActive: template.isActive },
      { title: updated.title, isActive: updated.isActive },
    );

    return updated;
  }

  async getEventTypes() {
    const events = await this.prisma.notificationEvent.findMany({
      select: { eventType: true },
      distinct: ["eventType"],
      orderBy: { eventType: "asc" },
    });
    return events.map((e) => e.eventType);
  }

  async getLogs(templateId: string, page = 1, limit = 20) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException("Template not found");

    const skip = (page - 1) * limit;
    const where: any = { title: template.title };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          event: {
            select: {
              id: true,
              eventType: true,
              entityType: true,
              entityId: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
