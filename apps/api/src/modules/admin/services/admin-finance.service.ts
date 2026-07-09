import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { FinanceService } from "../../finance/services/finance.service";

@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  // ── Ledger audit helper ──────────────────────────────────────────────────────
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

    const [totalPayments, refundPayments, paymentMethodSplit, overdueInvoices] = await Promise.all([
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
          (Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24),
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

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: status as any },
    });

    await this.audit(
      "ADMIN_FORCE_INVOICE_STATUS",
      "Invoice",
      invoiceId,
      userId,
      { status: invoice.status, reason },
      { status: updated.status },
    );

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
    const refundPayment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount: -refundAmount,
        method: "BANK_TRANSFER",
        status: "REFUNDED",
        notes: `استرداد: ${reason}`,
      },
    });

    await this.audit(
      "ADMIN_TRIGGER_REFUND",
      "Invoice",
      invoiceId,
      userId,
      { status: invoice.status, refundAmount },
      { refundPaymentId: refundPayment.id },
    );

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

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
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
  async retryWebhook(webhookId: string, userId: string) {
    const log = await this.prisma.webhookLog.findUnique({
      where: { id: webhookId },
    });
    if (!log) throw new NotFoundException("سجل الويب هوك غير موجود");
    if (log.processed)
      throw new BadRequestException("تمت معالجة هذا الويب هوك بالفعل");

    // Mark as processed (actual retry logic would call the external service)
    const updated = await this.prisma.webhookLog.update({
      where: { id: webhookId },
      data: { processed: true, error: null },
    });

    await this.audit(
      "ADMIN_RETRY_WEBHOOK",
      "WebhookLog",
      webhookId,
      userId,
      { provider: log.provider, eventType: log.eventType },
      { processed: true },
    );

    return updated;
  }

  // ── D3. Payment Gateways Health ───────────────────────────────────────────────
  async getGatewaysHealth() {
    const gateways = await this.prisma.paymentGateway.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { payments: true } },
      },
    });
    return gateways.map((g) => ({
      ...g,
      totalPayments: g._count.payments,
      healthStatus: g.isActive ? "healthy" : "down",
      lastHealthCheck: g.updatedAt,
    }));
  }
}
