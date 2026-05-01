import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceDto, CreateTicketDto, RegisterPaymentDto, CreateEmployeeDto, RunPayrollDto } from '../dto/finance.dto';
import { InvoiceStatus, TicketStatus, AutomationStatus, SalaryStatus } from '@hassad/shared';
import { NotificationsService } from '../../notifications/services/notifications.service';

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
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
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
      },
    });

    await this.logToLedger({
      action: 'CREATE_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      userId,
      after: invoice,
    });

    await this.notificationsService.createNotification({
      entityId: invoice.id,
      entityType: 'INVOICE',
      eventType: 'INVOICE_CREATED',
      userId,
      title: 'فاتورة جديدة',
      body: `تم إنشاء فاتورة جديدة بمبلغ ${invoice.amount} ر.س`,
    });

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
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const history = await this.prisma.ledger.findMany({
      where: { entityId: id },
      orderBy: { createdAt: 'desc' },
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
          status: AutomationStatus.SUCCESS,
          notes: dto.notes,
          date: dto.date ? new Date(dto.date) : new Date(),
        },
      });

      const totalPaid = invoice.payments.reduce((sum, pay) => sum + pay.amount, 0) + dto.amount;
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
      action: 'REGISTER_PAYMENT',
      entity: 'PAYMENT',
      entityId: payment.id,
      userId,
      after: payment,
    });

    await this.notificationsService.createNotification({
      entityId: payment.id,
      entityType: 'PAYMENT',
      eventType: 'PAYMENT_RECEIVED',
      userId,
      title: 'تم استلام دفع',
      body: `تم تسجيل دفعة بقيمة ${payment.amount} ر.س للفاتورة ${invoice.invoiceNumber}`,
    });

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
            action: 'GENERATE_SALARY',
            entity: 'SALARY',
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

  async getSummary() {
    const successfulPayments = await this.prisma.payment.aggregate({
      where: { status: AutomationStatus.SUCCESS },
      _sum: { amount: true },
    });

    const pendingInvoices = await this.prisma.invoice.aggregate({
      where: { status: { in: [InvoiceStatus.DUE, InvoiceStatus.PARTIAL, InvoiceStatus.SENT] } },
      _sum: { amount: true },
    });

    const failedPaymentsCount = await this.prisma.payment.count({
      where: { status: AutomationStatus.FAILED },
    });

    const totalRevenue = successfulPayments._sum.amount || 0;
    const totalPending = pendingInvoices._sum.amount || 0;

    return {
      totalRevenue,
      pendingInvoices: totalPending,
      failedPayments: failedPaymentsCount,
      monthlyProfit: totalRevenue * 0.15, // Mock profit logic
    };
  }

  async getCashFlow() {
    // Simple mock grouping for now, can be expanded with real date grouping
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];
    const data = months.map((m, i) => ({
      month: m,
      income: 100000 + i * 10000,
      expenses: 70000 + i * 5000,
    }));
    return data;
  }

  async getAlerts() {
    const lateInvoices = await this.prisma.invoice.findMany({
      where: { status: InvoiceStatus.LATE },
      include: { client: true },
      take: 5,
    });

    return lateInvoices.map(inv => ({
      id: inv.id,
      type: 'OVERDUE',
      client: inv.client.companyName,
      amount: inv.amount,
      date: inv.dueDate.toISOString().split('T')[0],
      status: 'UNPAID',
      severity: 'HIGH',
    }));
  }

  async findAllInvoices(filters: { status?: string; clientId?: string; page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { 
          client: { select: { id: true, companyName: true } },
          payments: true,
          contract: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: 'desc' },
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
        orderBy: { createdAt: 'desc' },
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
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    });
  }

  async findAllContracts() {
    const contracts = await this.prisma.contract.findMany({
      include: {
        client: true,
        invoices: {
          include: { payments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return contracts.map(contract => {
      const totalPaid = contract.invoices.reduce((acc, inv) => {
        return acc + inv.payments.reduce((sum, p) => sum + p.amount, 0);
      }, 0);

      return {
        ...contract,
        paid: totalPaid,
        remaining: contract.totalValue - totalPaid,
        collectionRate: contract.totalValue > 0 ? (totalPaid / contract.totalValue) * 100 : 0
      };
    });
  }
  async getLedger(filters: { page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.ledger.findMany({
        orderBy: { createdAt: 'desc' },
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
    return this.registerPayment('system', {
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
      action: 'SEND_INVOICE',
      entity: 'INVOICE',
      entityId: invoice.id,
      after: updated,
    });

    await this.notificationsService.createNotification({
      entityId: invoice.id,
      entityType: 'invoice',
      eventType: 'INVOICE_SENT',
      userId: invoice.createdBy,
      title: 'Invoice Sent',
      body: `Invoice has been sent to the client`,
    });

    return updated;
  }

  async findAllTickets(filters: { status?: string; page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    const [items, total] = await Promise.all([
      this.prisma.paymentTicket.findMany({
        where,
        include: { invoice: true, client: true, assignee: true },
        orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
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
