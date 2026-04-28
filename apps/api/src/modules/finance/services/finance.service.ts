import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceDto, CreateTicketDto } from '../dto/finance.dto';
import { InvoiceStatus, TicketStatus } from '@hassad/shared';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private generateInvoiceNumber(): string {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${ymd}-${rand}`;
  }

  async createInvoice(userId: string, dto: CreateInvoiceDto) {
    const invoiceNumber = dto.invoiceNumber ?? this.generateInvoiceNumber();
    return this.prisma.invoice.create({
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
  }

  async findInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        tickets: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async markInvoicePaid(id: string, paymentReference?: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentReference,
      },
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

  async findAllInvoices(filters: { status?: string; clientId?: string; page?: number; limit?: number }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { client: { select: { id: true, companyName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
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
