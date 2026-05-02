import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { FinanceService } from '../services/finance.service';
import { CreateInvoiceDto, CreateTicketDto, RegisterPaymentDto, RunPayrollDto } from '../dto/finance.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('finance/summary')
  @RequirePermissions('finance.read')
  getSummary() {
    return this.financeService.getSummary();
  }

  @Get('finance/cashflow')
  @RequirePermissions('finance.read')
  getCashFlow() {
    return this.financeService.getCashFlow();
  }

  @Get('finance/alerts')
  @RequirePermissions('finance.read')
  getAlerts() {
    return this.financeService.getAlerts();
  }

  @Post('invoices')
  @RequirePermissions('finance.create_invoice')
  createInvoice(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(user.id, dto);
  }

  @Get('invoices')
  @RequirePermissions('finance.read')
  findAllInvoices(@Query() filters: any) {
    return this.financeService.findAllInvoices(filters);
  }

  @Get('invoices/:id')
  @RequirePermissions('finance.read')
  findInvoice(@Param('id') id: string) {
    return this.financeService.findInvoice(id);
  }

  @Post('invoices/:id/send')
  @RequirePermissions('finance.update_invoice')
  sendInvoice(@Param('id') id: string) {
    return this.financeService.sendInvoice(id);
  }

  @Patch('invoices/:id/pay')
  @RequirePermissions('finance.update_invoice')
  payInvoice(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    // Wrap to registerPayment
    return this.financeService.registerPayment(user.id, {
      invoiceId: id,
      amount: dto.amount,
      method: dto.method,
      notes: dto.notes,
    });
  }

  @Post('payments')
  @RequirePermissions('finance.update_invoice')
  registerPayment(@CurrentUser() user: any, @Body() dto: RegisterPaymentDto) {
    return this.financeService.registerPayment(user.id, dto);
  }

  @Get('payments')
  @RequirePermissions('finance.read')
  findAllPayments(@Query() filters: any) {
    return this.financeService.findAllPayments(filters);
  }

  @Get('payroll')
  @RequirePermissions('finance.read')
  findAllEmployees() {
    return this.financeService.findAllEmployees();
  }

  @Post('payroll/run')
  @RequirePermissions('finance.manage_payroll')
  runPayroll(@CurrentUser() user: any, @Body() dto: RunPayrollDto) {
    return this.financeService.runPayroll(user.id, dto);
  }

  @Get('finance/contracts')
  @RequirePermissions('finance.read')
  findAllContracts() {
    return this.financeService.findAllContracts();
  }

  @Get('finance/ledger')
  @RequirePermissions('finance.read_ledger')
  getLedger(@Query() filters: any) {
    return this.financeService.getLedger(filters);
  }

  @Post('payment-tickets')
  @RequirePermissions('finance.manage_tickets')
  createTicket(@Body() dto: CreateTicketDto) {
    return this.financeService.createTicket(dto);
  }

  @Get('payment-tickets')
  @RequirePermissions('finance.read')
  findAllTickets(@Query() filters: any) {
    return this.financeService.findAllTickets(filters);
  }

  @Get('payment-tickets/:id')
  @RequirePermissions('finance.read')
  findOneTicket(@Param('id') id: string) {
    return this.financeService.findTicket(id);
  }

  @Patch('payment-tickets/:id/resolve')
  @RequirePermissions('finance.manage_tickets')
  resolveTicket(@Param('id') id: string) {
    return this.financeService.resolveTicket(id);
  }
}
