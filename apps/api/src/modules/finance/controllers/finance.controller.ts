import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from '../services/finance.service';
import { CreateInvoiceDto, CreateTicketDto } from '../dto/finance.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('invoices')
  @RequirePermissions('finance.create_invoice')
  createInvoice(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(user.id, dto);
  }

  @Get('invoices/:id')
  @RequirePermissions('finance.read')
  findInvoice(@Param('id') id: string) {
    return this.financeService.findInvoice(id);
  }

  @Post('invoices/:id/mark-paid')
  @RequirePermissions('finance.update_invoice')
  markPaid(@Param('id') id: string, @Body('paymentReference') paymentReference: string) {
    return this.financeService.markInvoicePaid(id, paymentReference);
  }

  @Post('payment-tickets')
  @RequirePermissions('finance.manage_tickets')
  createTicket(@Body() dto: CreateTicketDto) {
    return this.financeService.createTicket(dto);
  }

  @Get('payment-tickets/:id')
  @RequirePermissions('finance.read')
  findTicket(@Param('id') id: string) {
    return this.financeService.findTicket(id);
  }

  @Post('payment-tickets/:id/resolve')
  @RequirePermissions('finance.manage_tickets')
  resolveTicket(@Param('id') id: string) {
    return this.financeService.resolveTicket(id);
  }
}
