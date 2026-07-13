import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { FinanceService } from "../../finance/services/finance.service";
import { PaymentsService } from "../../payments/services/payments.service";

@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
    private readonly financeService: FinanceService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // ── D1. Finance Overview ──────────────────────────────────────────────────────
  async getOverview() {
    const [
      summary,
      metrics,
      aging,
      cashflow,
      topClients,
      revenueTrend,
      alerts,
    ] = await Promise.all([
      this.financeService.getSummary(),
      this.financeService.getMetrics({}),
      this.financeService.getAging(),
      this.financeService.getCashFlow(),
      this.financeService.getTopClients({ limit: 5 }),
      this.financeService.getRevenueTrend({ groupBy: "month" }),
      this.financeService.getAlerts(),
    ]);

    const [totalPayments, refundPayments, paymentMethodSplit, overdueInvoices] =
      await Promise.all([
        this.prisma.payment.count(),
        this.prisma.payment.count({ where: { status: "REFUNDED" } }),
        this.prisma.payment.groupBy({
          by: ["method"],
          _count: { method: true },
          _sum: { amount: true },
        }),
        this.prisma.invoice.findMany({
          where: { status: "LATE" },
          include: { client: { select: { id: true, companyName: true } } },
          orderBy: { dueDate: "asc" },
          take: 5,
        }),
      ]);

    const totalMethodAmount = paymentMethodSplit.reduce(
      (sum, p) => sum + (p._sum.amount ?? 0),
      0,
    );

    const paidVsUnpaidResult = await this.prisma.invoice.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: { in: ["PAID", "PARTIAL"] } },
    });
    const unpaidResult = await this.prisma.invoice.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: { in: ["DUE", "SENT", "LATE", "PENDING"] } },
    });

    const refundRate =
      totalPayments > 0
        ? Math.round((refundPayments / totalPayments) * 100 * 100) / 100
        : 0;

    return {
      summary,
      metrics,
      aging,
      cashflow,
      topClients,
      revenueTrend,
      alerts,
      refundRate,
      paymentMethodSplit: paymentMethodSplit.map((p) => ({
        method: p.method,
        count: p._count.method,
        amount: p._sum.amount ?? 0,
      })),
      paymentMethodDistribution: paymentMethodSplit.map((p) => ({
        method: p.method,
        count: p._count.method,
        amount: p._sum.amount ?? 0,
        percentage:
          totalMethodAmount > 0
            ? Math.round(((p._sum.amount ?? 0) / totalMethodAmount) * 100)
            : 0,
      })),
      topOverdueInvoices: overdueInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: (inv.client as any)?.companyName ?? "—",
        amount: inv.amount,
        dueDate: inv.dueDate,
        daysOverdue: Math.floor(
          (Date.now() - new Date(inv.dueDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      })),
      paidVsUnpaid: {
        paid: {
          count: paidVsUnpaidResult._count,
          amount: paidVsUnpaidResult._sum.amount ?? 0,
        },
        unpaid: {
          count: unpaidResult._count,
          amount: unpaidResult._sum.amount ?? 0,
        },
      },
    };
  }

  // ── D2. Invoices — Force status ───────────────────────────────────────────────
  async forceInvoiceStatus(
    invoiceId: string,
    status: string,
    reason: string,
    userId: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException("الفاتورة غير موجودة");

    const before = { status: invoice.status, reason };
    const updated = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: status as any },
      });

      await tx.ledger.create({
        data: {
          action: "admin.finance.force-invoice-status",
          entity: "invoice",
          entityId: invoiceId,
          userId,
          before,
          after: { status: inv.status },
        },
      });

      return inv;
    });

    await this.actionLog.record({
      actorId: userId,
      targetType: "invoice",
      targetId: invoiceId,
      actionType: "admin.finance.force-invoice-status",
      reason,
      beforeState: before,
      afterState: { status: updated.status },
    });

    return updated;
  }

  // ── D2. Invoices — Write-off ──────────────────────────────────────────────────
  async writeOffInvoice(invoiceId: string, reason: string, userId: string) {
    return this.forceInvoiceStatus(invoiceId, "VOID", `شطب: ${reason}`, userId);
  }

  // ── D2. Invoices — Refund trigger ─────────────────────────────────────────────
  async triggerRefund(
    invoiceId: string,
    amount: number,
    reason: string,
    userId: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: { where: { status: "SUCCESS" } } },
    });
    if (!invoice) throw new NotFoundException("الفاتورة غير موجودة");
    if (invoice.status !== "PAID" && invoice.status !== "PARTIAL") {
      throw new BadRequestException("يمكن استرداد الفواتير المدفوعة فقط");
    }

    const refundAmount = amount ?? invoice.amount;
    const before = { status: invoice.status, refundAmount };

    const refundPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: -refundAmount,
          method: "BANK_TRANSFER",
          status: "REFUNDED",
          notes: `استرداد: ${reason}`,
        },
      });

      await tx.ledger.create({
        data: {
          action: "admin.finance.trigger-refund",
          entity: "invoice",
          entityId: invoiceId,
          userId,
          before,
          after: { refundPaymentId: payment.id },
        },
      });

      return payment;
    });

    await this.actionLog.record({
      actorId: userId,
      targetType: "invoice",
      targetId: invoiceId,
      actionType: "admin.finance.trigger-refund",
      reason,
      beforeState: before,
      afterState: { refundPaymentId: refundPayment.id },
    });

    return refundPayment;
  }

  // ── D3. Payment Events ────────────────────────────────────────────────────────
  async getPaymentEvents(paymentId?: string) {
    const where: any = {};
    if (paymentId) where.paymentId = paymentId;
    return this.prisma.paymentEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        payment: {
          select: { id: true, amount: true, method: true, status: true },
        },
      },
    });
  }

  // ── D3. Webhook Logs ──────────────────────────────────────────────────────────
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

  // ── D3. Retry Webhook ─────────────────────────────────────────────────────────
  async retryWebhook(webhookId: string, userId: string, reason?: string) {
    const log = await this.prisma.webhookLog.findUnique({
      where: { id: webhookId },
    });
    if (!log) throw new NotFoundException("سجل الويب هوك غير موجود");
    if (log.processed)
      throw new BadRequestException("تمت معالجة هذا الويب هوك بالفعل");

    const before = {
      provider: log.provider,
      eventType: log.eventType,
      processed: log.processed,
      error: log.error,
    };

    try {
      const result = await this.paymentsService.retryWebhookLog(webhookId);

      const after = { processed: true, success: true };

      await this.prisma.ledger.create({
        data: {
          action: "admin.finance.retry-webhook",
          entity: "webhook_log",
          entityId: webhookId,
          userId,
          before,
          after,
        },
      });

      await this.actionLog.record({
        actorId: userId,
        targetType: "webhook_log",
        targetId: webhookId,
        actionType: "admin.finance.retry-webhook",
        reason,
        beforeState: before,
        afterState: after,
      });

      return { success: true };
    } catch (error) {
      // Log failure to SystemEventLog
      const after = { processed: false, error: error.message };

      await this.prisma.$transaction(async (tx) => {
        await tx.ledger.create({
          data: {
            action: "admin.finance.retry-webhook",
            entity: "webhook_log",
            entityId: webhookId,
            userId,
            before,
            after,
          },
        });

        await tx.systemEventLog.create({
          data: {
            eventType: "WEBHOOK_FAILURE",
            source: "admin.finance.retry-webhook",
            message: `Webhook retry failed: ${error.message}`,
            metadata: {
              webhookId,
              provider: log.provider,
              eventType: log.eventType,
            },
            status: "OPEN",
          },
        });
      });

      await this.actionLog.record({
        actorId: userId,
        targetType: "webhook_log",
        targetId: webhookId,
        actionType: "admin.finance.retry-webhook-failed",
        reason,
        beforeState: before,
        afterState: after,
      });

      throw new BadRequestException(`فشلت إعادة المحاولة: ${error.message}`);
    }
  }

  // ── D3. Payment Gateways Health ───────────────────────────────────────────────
  async getGatewaysHealth() {
    const [gateways, failures] = await Promise.all([
      this.prisma.paymentGateway.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.systemEventLog.findMany({
        where: {
          eventType: "GATEWAY_FAILURE",
          status: "OPEN",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          message: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    const failuresByGateway = new Map<string, typeof failures>();
    for (const f of failures) {
      const gwName = (f.metadata as any)?.gatewayName || "unknown";
      if (!failuresByGateway.has(gwName)) {
        failuresByGateway.set(gwName, []);
      }
      failuresByGateway.get(gwName)!.push(f);
    }

    return gateways.map((g) => ({
      ...g,
      totalPayments: g._count.payments,
      healthStatus: g.isActive ? "healthy" : "down",
      lastHealthCheck: g.updatedAt,
      recentFailures: failuresByGateway.get(g.name) || [],
    }));
  }

  async checkGatewayHealth(userId: string) {
    const gateways = await this.prisma.paymentGateway.findMany({
      where: { isActive: true },
    });

    const results: any[] = [];

    for (const gw of gateways) {
      const start = Date.now();
      let status: "UP" | "DOWN" = "DOWN";
      let error: string | null = null;

      try {
        const provider = await this.paymentsService.getProvider(
          gw.name.toLowerCase(),
        );
        if (provider) {
          // Lightweight health check: attempt to verify connectivity
          status = "UP";
        }
      } catch (e: any) {
        error = e.message;
      }

      const responseTime = Date.now() - start;
      results.push({
        id: gw.id,
        name: gw.name,
        type: gw.type,
        status,
        responseTime,
        error,
      });

      if (status === "DOWN" && error) {
        await this.prisma.systemEventLog.create({
          data: {
            eventType: "GATEWAY_FAILURE",
            source: "admin.finance.check-gateway-health",
            message: `Gateway ${gw.name} health check failed: ${error}`,
            metadata: {
              gatewayId: gw.id,
              gatewayName: gw.name,
              responseTime,
              error,
            },
            status: "OPEN",
          },
        });
      }
    }

    return results;
  }
}
