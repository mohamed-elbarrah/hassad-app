import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceDto, CreateTicketDto } from '../dto/finance.dto';
import { InvoiceStatus, TicketStatus } from '@hassad/shared';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(userId: string, dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        ...dto,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
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

  async createTicket(dto: CreateTicketDto) {
    return this.prisma.paymentTicket.create({
      data: {
        ...dto,
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
