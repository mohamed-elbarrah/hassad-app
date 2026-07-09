import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminIntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Webhook Logs ─────────────────────────────────────────────────────────────
  async getWebhookLogs(filters: {
    status?: string;
    provider?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.status === "failed") where.processed = false;
    if (filters.status === "success") where.processed = true;
    if (filters.provider) where.provider = filters.provider;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webhookLog.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async retryWebhook(id: string) {
    const log = await this.prisma.webhookLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException("سجل الويب هوك غير موجود");
    if (log.processed) throw new Error("تمت معالجة هذا الويب هوك بالفعل");
    return this.prisma.webhookLog.update({
      where: { id },
      data: { processed: true, error: null },
    });
  }

  // ── Ad Platform Connections ──────────────────────────────────────────────────
  async getAdPlatformConnections() {
    return this.prisma.adPlatformConnection.findMany({
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { id: true, name: true } } },
    });
  }

  // ── Payment Gateways ──────────────────────────────────────────────────────────
  async getGateways() {
    return this.prisma.paymentGateway.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
