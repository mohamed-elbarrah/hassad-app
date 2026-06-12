import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateInvoiceDto,
  CreateTicketDto,
  RegisterPaymentDto,
  CreateEmployeeDto,
  RunPayrollDto,
  DateRangeDto,
  TopClientsDto,
  RevenueTrendDto,
  FinanceMetricsDto,
} from "../dto/finance.dto";
import {
  InvoiceStatus,
  TicketStatus,
  PaymentStatus,
  SalaryStatus,
  PaymentMethod,
} from "@hassad/shared";
import type { ServiceItem } from "@hassad/shared";
import { NotificationsService } from "../../notifications/services/notifications.service";

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async logToLedger(params: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    before?: any;
    after?: any;
  }) {
    return this.prisma.ledger.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        before: params.before,
        after: params.after,
      },
    });
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${ymd}-${rand}`;
  }

  async createInvoice(userId: string, dto: CreateInvoiceDto) {
    const invoiceNumber = dto.invoiceNumber ?? this.generateInvoiceNumber();
    const invoice = await this.prisma.invoice.create({
      data: {
        clientId: dto.clientId,
        contractId: dto.contractId,
        invoiceNumber,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
        createdBy: userId,
        status: InvoiceStatus.DUE,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                projectId: item.projectId,
                taskId: item.taskId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    await this.logToLedger({
      action: "CREATE_INVOICE",
      entity: "INVOICE",
      entityId: invoice.id,
      userId,
      after: invoice,
    });

    const clientUser = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { userId: true },
    });

    if (clientUser?.userId) {
      await this.notificationsService.createNotification({
        entityId: invoice.id,
        entityType: "INVOICE",
        eventType: "INVOICE_CREATED",
        userId: clientUser.userId,
        title: "فاتورة جديدة",
        body: `تم إنشاء فاتورة جديدة بمبلغ ${invoice.amount} ر.س`,
      });
    }

    return invoice;
  }

  async generateInvoiceFromContract(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        clientId: true,
        title: true,
        totalValue: true,
        servicesList: true,
        proposal: { select: { durationDays: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException("Contract not found");
    }

    const services = (contract.servicesList as ServiceItem[]) || [];
    const invoiceNumber = this.generateInvoiceNumber();
    const durationDays = contract.proposal?.durationDays ?? 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + durationDays);

    if (services.length === 0) {
      const invoice = await this.prisma.invoice.create({
        data: {
          clientId: contract.clientId,
          contractId: contract.id,
          createdBy: userId,
          invoiceNumber,
          amount: contract.totalValue,
          status: InvoiceStatus.PENDING,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          issueDate: new Date(),
          dueDate,
          items: {
            create: {
              description: contract.title,
              quantity: 1,
              unitPrice: contract.totalValue,
              total: contract.totalValue,
            },
          },
        },
        include: { items: true },
      });

      await this.logToLedger({
        action: "AUTO_GENERATE_INVOICE",
        entity: "INVOICE",
        entityId: invoice.id,
        userId,
        after: invoice,
      });

      return invoice;
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        clientId: contract.clientId,
        contractId: contract.id,
        createdBy: userId,
        invoiceNumber,
        amount: contract.totalValue,
        status: InvoiceStatus.PENDING,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        issueDate: new Date(),
        dueDate,
        notes: `فاتورة تلقائية من العقد: ${contract.title}`,
        items: {
          create: services.map((svc) => ({
            description: svc.name,
            quantity: 1,
            unitPrice: svc.price,
            total: svc.price,
          })),
        },
      },
      include: { items: true },
    });

    await this.logToLedger({
      action: "AUTO_GENERATE_INVOICE",
      entity: "INVOICE",
      entityId: invoice.id,
      userId,
      after: invoice,
    });

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });

    if (clientUser?.userId) {
      this.notificationsService
        .createNotification({
          entityId: invoice.id,
          entityType: "invoice",
          eventType: "INVOICE_CREATED",
          userId: clientUser.userId,
          title: "تم إنشاء فاتورة تلقائية",
          body: `تم إنشاء فاتورة تلقائية رقم ${invoiceNumber} للعقد "${contract.title}"`,
        })
        .catch(() => undefined);
    }

    return invoice;
  }

  async findInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        tickets: true,
        payments: true,
        items: { include: { project: true, task: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const history = await this.prisma.ledger.findMany({
      where: { entityId: id },
      orderBy: { createdAt: "desc" },
    });

    return { ...invoice, history };
  }

  async registerPayment(userId: string, dto: RegisterPaymentDto) {
    const invoice = await this.findInvoice(dto.invoiceId);

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          method: dto.method,
          status: PaymentStatus.SUCCESS,
          notes: dto.notes,
          date: dto.date ? new Date(dto.date) : new Date(),
        },
      });

      const totalPaid =
        invoice.payments.reduce((sum, pay) => sum + pay.amount, 0) + dto.amount;
      let newStatus: InvoiceStatus = InvoiceStatus.PARTIAL;
      if (totalPaid >= invoice.amount) {
        newStatus = InvoiceStatus.PAID;
      }

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          status: newStatus,
          paidAt: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
        },
      });

      return p;
    });

    await this.logToLedger({
      action: "REGISTER_PAYMENT",
      entity: "PAYMENT",
      entityId: payment.id,
      userId,
      after: payment,
    });

    const clientUser = await this.prisma.client.findUnique({
      where: { id: invoice.clientId },
      select: { userId: true },
    });

    if (clientUser?.userId) {
      await this.notificationsService.createNotification({
        entityId: payment.id,
        entityType: "PAYMENT",
        eventType: "PAYMENT_RECEIVED",
        userId: clientUser.userId,
        title: "تم استلام دفع",
        body: `تم تسجيل دفعة بقيمة ${payment.amount} ر.س للفاتورة ${invoice.invoiceNumber}`,
      });
    }

    return payment;
  }

  async runPayroll(userId: string, dto: RunPayrollDto) {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });

    const results = await this.prisma.$transaction(async (tx) => {
      const salaries = [];
      for (const emp of employees) {
        const existing = await tx.salary.findFirst({
          where: {
            employeeId: emp.id,
            month: dto.month,
            year: dto.year,
          },
        });

        if (!existing) {
          const s = await tx.salary.create({
            data: {
              employeeId: emp.id,
              amount: emp.baseSalary,
              baseSalary: emp.baseSalary,
              status: SalaryStatus.PENDING,
              month: dto.month,
              year: dto.year,
            },
          });
          salaries.push(s);

          await this.logToLedger({
            action: "GENERATE_SALARY",
            entity: "SALARY",
            entityId: s.id,
            userId,
            after: s,
          });
        }
      }
      return salaries;
    });

    return { generated: results.length };
  }

  // ── Date helpers ───────────────────────────────────────────────────────────

  private getDateRange(dto?: DateRangeDto): { from: Date; to: Date } {
    const to = dto?.to ? new Date(dto.to) : new Date();
    to.setHours(23, 59, 59, 999);
    const from = dto?.from
      ? new Date(dto.from)
      : new Date(to.getFullYear(), to.getMonth(), 1);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }

  private getPreviousPeriod(from: Date, to: Date): { prevFrom: Date; prevTo: Date } {
    const duration = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - duration);
    return { prevFrom, prevTo };
  }

  // ── Metrics ───────────────────────────────────────────────────────────────

  async getMetrics(dto: FinanceMetricsDto) {
    const { from, to } = this.getDateRange(dto);
    const { prevFrom, prevTo } = this.getPreviousPeriod(from, to);

    const buildWhere = (start: Date, end: Date) => ({
      gte: start,
      lte: end,
    });

    // Current period
    const [revenueAgg, pendingAgg, failedAgg, invoiceAgg, salaryAgg] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            status: PaymentStatus.SUCCESS,
            date: buildWhere(from, to),
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            status: { in: [InvoiceStatus.DUE, InvoiceStatus.PARTIAL, InvoiceStatus.SENT, InvoiceStatus.LATE] },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            status: PaymentStatus.FAILED,
            date: buildWhere(from, to),
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            createdAt: buildWhere(from, to),
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
        this.prisma.salary.aggregate({
          where: {
            status: SalaryStatus.PAID,
            paymentDate: buildWhere(from, to),
          },
          _sum: { amount: true },
        }),
      ]);

    // Previous period for comparison
    const [prevRevenueAgg, prevInvoiceAgg, prevSalaryAgg] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          date: buildWhere(prevFrom, prevTo),
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          createdAt: buildWhere(prevFrom, prevTo),
        },
        _sum: { amount: true },
      }),
      this.prisma.salary.aggregate({
        where: {
          status: SalaryStatus.PAID,
          paymentDate: buildWhere(prevFrom, prevTo),
        },
        _sum: { amount: true },
      }),
    ]);

    const revenue = revenueAgg._sum.amount || 0;
    const prevRevenue = prevRevenueAgg._sum.amount || 0;
    const pending = pendingAgg._sum.amount || 0;
    const failedValue = failedAgg._sum.amount || 0;
    const failedCount = failedAgg._count.id || 0;
    const invoiceTotal = invoiceAgg._sum.amount || 0;
    const invoiceCount = invoiceAgg._count.id || 0;
    const salaryTotal = salaryAgg._sum.amount || 0;
    const prevSalaryTotal = prevSalaryAgg._sum.amount || 0;
    const prevInvoiceTotal = prevInvoiceAgg._sum.amount || 0;

    // Collection rate: all-time paid / all-time invoiced
    const [allTimePaid, allTimeInvoiced] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
      }),
    ]);
    const collectionRate =
      (allTimeInvoiced._sum.amount || 0) > 0
        ? ((allTimePaid._sum.amount || 0) / (allTimeInvoiced._sum.amount || 0)) * 100
        : 0;

    // Active clients (unique clients with invoices in range)
    const activeClients = await this.prisma.invoice.groupBy({
      by: ["clientId"],
      where: { createdAt: buildWhere(from, to) },
      _count: { clientId: true },
    });

    // Late count
    const lateCount = await this.prisma.invoice.count({
      where: { status: InvoiceStatus.LATE },
    });

    const pctChange = (curr: number, prev: number) =>
      prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(1)) : curr > 0 ? 100 : 0;

    return {
      revenue,
      revenueChange: pctChange(revenue, prevRevenue),
      pending,
      pendingLateCount: lateCount,
      collectionRate: Number(collectionRate.toFixed(1)),
      failedPaymentsValue: failedValue,
      failedPaymentsCount: failedCount,
      invoicesTotal: invoiceTotal,
      invoicesCount: invoiceCount,
      invoicesChange: pctChange(invoiceTotal, prevInvoiceTotal),
      salariesTotal: salaryTotal,
      salariesChange: pctChange(salaryTotal, prevSalaryTotal),
      activeClients: activeClients.length,
      // Net "profit" placeholder: revenue - salaries (until expense tracking is built)
      netProfit: revenue - salaryTotal,
      netProfitChange: pctChange(revenue - salaryTotal, prevRevenue - prevSalaryTotal),
      averageInvoice: invoiceCount > 0 ? Math.round(invoiceTotal / invoiceCount) : 0,
      period: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  // ── Cash Flow (real data) ─────────────────────────────────────────────────

  async getCashFlow(dto?: DateRangeDto) {
    const { from, to } = this.getDateRange(dto);
    const months: { label: string; income: number; expenses: number }[] = [];

    let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);

    while (cursor <= end) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);

      const [incomeAgg, expenseAgg] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            status: PaymentStatus.SUCCESS,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.salary.aggregate({
          where: {
            status: SalaryStatus.PAID,
            paymentDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      const monthNames = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
      ];

      months.push({
        label: `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`,
        income: incomeAgg._sum.amount || 0,
        expenses: expenseAgg._sum.amount || 0,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }

  // ── Aging ───────────────────────────────────────────────────────────────────

  async getAging() {
    const now = new Date();

    const unpaid = await this.prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.DUE, InvoiceStatus.PARTIAL, InvoiceStatus.SENT, InvoiceStatus.LATE] },
      },
      include: {
        payments: true,
        client: { select: { companyName: true } },
      },
    });

    const buckets = {
      current: { label: "0-30 يوم", amount: 0, count: 0 },
      thirty: { label: "31-60 يوم", amount: 0, count: 0 },
      sixty: { label: "61-90 يوم", amount: 0, count: 0 },
      ninety: { label: "+90 يوم", amount: 0, count: 0 },
    };

    for (const inv of unpaid) {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = inv.amount - paid;
      if (remaining <= 0) continue;

      const days = Math.floor(
        (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (days <= 30) {
        buckets.current.amount += remaining;
        buckets.current.count += 1;
      } else if (days <= 60) {
        buckets.thirty.amount += remaining;
        buckets.thirty.count += 1;
      } else if (days <= 90) {
        buckets.sixty.amount += remaining;
        buckets.sixty.count += 1;
      } else {
        buckets.ninety.amount += remaining;
        buckets.ninety.count += 1;
      }
    }

    return Object.values(buckets);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async getActions() {
    const now = new Date();

    const [lateInvoices, unsentInvoices, failedPayments, pendingSalaries] =
      await Promise.all([
        this.prisma.invoice.findMany({
          where: { status: InvoiceStatus.LATE },
          include: { client: { select: { companyName: true } } },
          take: 5,
          orderBy: { dueDate: "asc" },
        }),
        this.prisma.invoice.findMany({
          where: { status: InvoiceStatus.DUE, sentAt: null },
          include: { client: { select: { companyName: true } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.payment.findMany({
          where: { status: PaymentStatus.FAILED },
          include: { invoice: { include: { client: { select: { companyName: true } } } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.salary.findMany({
          where: { status: SalaryStatus.PENDING },
          include: { employee: { select: { name: true } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const actions: Array<{
      id: string;
      type: "LATE_INVOICE" | "UNSENT_INVOICE" | "FAILED_PAYMENT" | "PENDING_SALARY";
      title: string;
      description: string;
      amount?: number;
      entityId: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
    }> = [];

    for (const inv of lateInvoices) {
      actions.push({
        id: `late-${inv.id}`,
        type: "LATE_INVOICE",
        title: `فاتورة متأخرة: ${inv.invoiceNumber}`,
        description: inv.client?.companyName || "عميل غير معروف",
        amount: inv.amount,
        entityId: inv.id,
        priority: "HIGH",
      });
    }

    for (const inv of unsentInvoices) {
      actions.push({
        id: `unsent-${inv.id}`,
        type: "UNSENT_INVOICE",
        title: `فاتورة غير مرسلة: ${inv.invoiceNumber}`,
        description: inv.client?.companyName || "عميل غير معروف",
        amount: inv.amount,
        entityId: inv.id,
        priority: "MEDIUM",
      });
    }

    for (const p of failedPayments) {
      actions.push({
        id: `failed-${p.id}`,
        type: "FAILED_PAYMENT",
        title: `عملية دفع فاشلة`,
        description: p.invoice?.client?.companyName || "عميل غير معروف",
        amount: p.amount,
        entityId: p.id,
        priority: "HIGH",
      });
    }

    for (const s of pendingSalaries) {
      actions.push({
        id: `salary-${s.id}`,
        type: "PENDING_SALARY",
        title: `راتب معلق: ${s.employee?.name || "موظف"}`,
        description: `${s.month}/${s.year}`,
        amount: s.amount,
        entityId: s.id,
        priority: "MEDIUM",
      });
    }

    return actions;
  }

  // ── Top Clients ─────────────────────────────────────────────────────────────

  async getTopClients(dto: TopClientsDto) {
    const { from, to } = this.getDateRange(dto);
    const limit = dto.limit || 5;

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        date: { gte: from, lte: to },
      },
      include: {
        invoice: {
          include: {
            client: { select: { id: true, companyName: true } },
          },
        },
      },
    });

    const map = new Map<
      string,
      { clientId: string; companyName: string; revenue: number; paymentCount: number }
    >();

    for (const p of payments) {
      const cid = p.invoice?.client?.id;
      if (!cid) continue;
      const existing = map.get(cid);
      if (existing) {
        existing.revenue += p.amount;
        existing.paymentCount += 1;
      } else {
        map.set(cid, {
          clientId: cid,
          companyName: p.invoice.client.companyName || "—",
          revenue: p.amount,
          paymentCount: 1,
        });
      }
    }

    const clients = Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // Attach invoice count and collection rate per client
    const enriched = await Promise.all(
      clients.map(async (c) => {
        const invoices = await this.prisma.invoice.findMany({
          where: { clientId: c.clientId },
          include: { payments: true },
        });
        const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
        const totalPaid = invoices.reduce(
          (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
          0,
        );
        return {
          ...c,
          invoiceCount: invoices.length,
          collectionRate:
            totalInvoiced > 0 ? Number(((totalPaid / totalInvoiced) * 100).toFixed(1)) : 0,
        };
      }),
    );

    return enriched;
  }

  // ── Revenue Trend ───────────────────────────────────────────────────────────

  async getRevenueTrend(dto: RevenueTrendDto) {
    const { from, to } = this.getDateRange(dto);
    const groupBy = dto.groupBy || "month";

    // ── 1. Generate all date buckets in range (0-padded) ────────────────────
    const allBuckets = new Map<string, { label: string; income: number; invoiced: number }>();

    const monthNames = [
      "يناير","فبراير","مارس","أبريل","مايو","يونيو",
      "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
    ];

    let cursor = new Date(from);
    cursor.setHours(0,0,0,0);

    while (cursor <= to) {
      let key: string;
      let label: string;

      if (groupBy === "day") {
        key = cursor.toISOString().split("T")[0];
        label = `${cursor.getDate()} ${monthNames[cursor.getMonth()]}`;
      } else if (groupBy === "week") {
        const weekStart = new Date(cursor);
        weekStart.setDate(cursor.getDate() - cursor.getDay());
        key = weekStart.toISOString().split("T")[0];
        label = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]}`;
      } else {
        key = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}`;
        label = `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}`;
      }

      if (!allBuckets.has(key)) {
        allBuckets.set(key, { label, income: 0, invoiced: 0 });
      }

      // Advance cursor
      if (groupBy === "day") {
        cursor.setDate(cursor.getDate() + 1);
      } else if (groupBy === "week") {
        cursor.setDate(cursor.getDate() + 7);
      } else {
        cursor.setMonth(cursor.getMonth() + 1);
        cursor.setDate(1);
      }
    }

    // ── 2. Fetch real data ──────────────────────────────────────────────────
    const [payments, invoices] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.SUCCESS,
          date: { gte: from, lte: to },
        },
        select: { amount: true, date: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          createdAt: { gte: from, lte: to },
        },
        select: { amount: true, createdAt: true },
      }),
    ]);

    // ── 3. Aggregate into buckets ───────────────────────────────────────────
    const keyFor = (d: Date) => {
      if (groupBy === "day") return d.toISOString().split("T")[0];
      if (groupBy === "week") {
        const start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        return start.toISOString().split("T")[0];
      }
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    };

    for (const p of payments) {
      const k = keyFor(new Date(p.date));
      const b = allBuckets.get(k);
      if (b) b.income += p.amount;
    }

    for (const inv of invoices) {
      const k = keyFor(new Date(inv.createdAt));
      const b = allBuckets.get(k);
      if (b) b.invoiced += inv.amount;
    }

    // ── 4. Return sorted ──────────────────────────────────────────────────────
    return Array.from(allBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }

  // ── Payment Method Distribution ───────────────────────────────────────────

  async getPaymentMethodDistribution(dto?: DateRangeDto) {
    const { from, to } = this.getDateRange(dto);

    const payments = await this.prisma.payment.groupBy({
      by: ["method"],
      where: {
        status: PaymentStatus.SUCCESS,
        date: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const total = payments.reduce((s, p) => s + (p._sum.amount || 0), 0);

    const methodLabels: Record<string, string> = {
      APPLE_PAY: "Apple Pay",
      MADA: "مدى",
      VISA_MC: "Visa / Mastercard",
      TABBY: "تابي",
      TAMARA: "تمارا",
      BANK_TRANSFER: "تحويل بنكي",
      CARD: "بطاقة",
      CASH: "نقدي",
    };

    return payments.map((p) => ({
      method: p.method,
      label: methodLabels[p.method] || p.method,
      amount: p._sum.amount || 0,
      count: p._count.id || 0,
      percentage: total > 0 ? Number((((p._sum.amount || 0) / total) * 100).toFixed(1)) : 0,
    }));
  }

  // ── Legacy summary (backward compat) ────────────────────────────────────────

  async getSummary() {
    return this.getMetrics({});
  }

  async getAlerts() {
    const lateInvoices = await this.prisma.invoice.findMany({
      where: { status: InvoiceStatus.LATE },
      include: { client: true },
      take: 5,
    });

    return lateInvoices.map((inv) => ({
      id: inv.id,
      type: "OVERDUE",
      client: inv.client.companyName,
      amount: inv.amount,
      date: inv.dueDate.toISOString().split("T")[0],
      status: "UNPAID",
      severity: "HIGH",
    }));
  }

  async findAllInvoices(filters: {
    status?: string;
    clientId?: string;
    contractId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.contractId) where.contractId = filters.contractId;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          payments: true,
          contract: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllPayments(filters: { page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        include: { invoice: { include: { client: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllEmployees() {
    return this.prisma.employee.findMany({
      include: {
        user: true,
        salaries: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  async findAllContracts() {
    const contracts = await this.prisma.contract.findMany({
      include: {
        client: true,
        invoices: {
          include: { payments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return contracts.map((contract) => {
      const totalPaid = contract.invoices.reduce((acc, inv) => {
        return acc + inv.payments.reduce((sum, p) => sum + p.amount, 0);
      }, 0);

      return {
        ...contract,
        paid: totalPaid,
        remaining: contract.totalValue - totalPaid,
        collectionRate:
          contract.totalValue > 0 ? (totalPaid / contract.totalValue) * 100 : 0,
      };
    });
  }
  async getLedger(filters: { page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.ledger.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ledger.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Legacy support or wrap
  async markInvoicePaid(id: string, paymentReference?: string) {
    const invoice = await this.findInvoice(id);
    return this.registerPayment("system", {
      invoiceId: id,
      amount: invoice.amount,
      method: invoice.paymentMethod as any,
      notes: paymentReference ? `Reference: ${paymentReference}` : undefined,
    });
  }

  async sendInvoice(id: string) {
    const invoice = await this.findInvoice(id);

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.SENT,
        sentAt: new Date(),
      },
    });

    await this.logToLedger({
      action: "SEND_INVOICE",
      entity: "INVOICE",
      entityId: invoice.id,
      after: updated,
    });

    const clientUser = await this.prisma.client.findUnique({
      where: { id: invoice.clientId },
      select: { userId: true },
    });

    if (clientUser?.userId) {
      await this.notificationsService.createNotification({
        entityId: invoice.id,
        entityType: "invoice",
        eventType: "INVOICE_SENT",
        userId: clientUser.userId,
        title: "تم إرسال فاتورة",
        body: `تم إرسال الفاتورة "${invoice.invoiceNumber}" إليك للمراجعة والدفع`,
      });
    }

    return updated;
  }

  async findAllTickets(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    const [items, total] = await Promise.all([
      this.prisma.paymentTicket.findMany({
        where,
        include: { invoice: true, client: true, assignee: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.paymentTicket.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findInvoicesByClient(clientId: string) {
    return this.prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTicket(dto: CreateTicketDto) {
    return this.prisma.paymentTicket.create({
      data: {
        invoiceId: dto.invoiceId,
        clientId: dto.clientId,
        assignedTo: dto.assignedTo,
        notes: dto.notes,
        status: TicketStatus.PENDING,
      },
    });
  }

  async resolveTicket(id: string) {
    return this.prisma.paymentTicket.update({
      where: { id },
      data: {
        status: TicketStatus.PAID,
        resolvedAt: new Date(),
      },
    });
  }

  async findTicket(id: string) {
    const ticket = await this.prisma.paymentTicket.findUnique({
      where: { id },
      include: {
        invoice: true,
        client: true,
        assignee: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }
}
