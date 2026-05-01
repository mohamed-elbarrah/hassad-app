import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  async createIntent(@Body() dto: { invoiceId: string; gatewayName: string; amount: number; currency?: string }) {
    return this.paymentsService.createPayment(dto);
  }

  @Get('gateways')
  @RequirePermissions('finance.read')
  async getGateways() {
    return this.paymentsService.getGateways();
  }

  @Post('gateways/:name')
  @RequirePermissions('finance.admin')
  async updateGateway(@Param('name') name: string, @Body() dto: any) {
    return this.paymentsService.updateGatewayConfig(name, dto);
  }

  @Get('bank-accounts')
  async getBankAccounts() {
    return this.paymentsService.getBankAccounts();
  }

  @Post('bank-accounts')
  @RequirePermissions('finance.admin')
  async createBankAccount(@Body() dto: any) {
    return this.paymentsService.createBankAccount(dto);
  }

  @Patch('bank-accounts/:id')
  @RequirePermissions('finance.admin')
  async updateBankAccount(@Param('id') id: string, @Body() dto: any) {
    return this.paymentsService.updateBankAccount(id, dto);
  }

  @Delete('bank-accounts/:id')
  @RequirePermissions('finance.admin')
  async deleteBankAccount(@Param('id') id: string) {
    return this.paymentsService.deleteBankAccount(id);
  }
}
