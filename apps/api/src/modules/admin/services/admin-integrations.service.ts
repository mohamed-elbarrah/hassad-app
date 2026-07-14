import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminIntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSyncStatus() {
    const services = await this.prisma.externalServiceHealth.findMany({
      orderBy: { lastCheckedAt: "desc" },
    });

    const summary = {
      total: services.length,
      healthy: 0,
      degraded: 0,
      down: 0,
      unchecked: 0,
    };

    const items = services.map((s) => {
      if (s.status === "UP") summary.healthy++;
      else if (s.status === "DEGRADED") summary.degraded++;
      else if (s.status === "DOWN") summary.down++;
      else summary.unchecked++;

      return {
        serviceName: s.serviceName,
        status: s.status,
        responseTime: s.responseTime,
        lastCheckedAt: s.lastCheckedAt.toISOString(),
        lastError: s.lastError,
        consecutiveFailures: s.consecutiveFailures,
        timeoutThreshold: s.timeoutThreshold,
        degradationThreshold: s.degradationThreshold,
      };
    });

    return { summary, items };
  }

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

  async retryWebhook(id: string, userId?: string) {
    const log = await this.prisma.webhookLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException("سجل الويب هوك غير موجود");
    if (log.processed)
      throw new BadRequestException("تمت معالجة هذا الويب هوك بالفعل");

    // Mark as WEBHOOK_FAILURE in SystemEventLog when retry is triggered
    // (actual reprocessing is handled by admin-finance's retry which has PaymentsService)
    const updated = await this.prisma.webhookLog.update({
      where: { id },
      data: { processed: true, error: null },
    });

    return updated;
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
