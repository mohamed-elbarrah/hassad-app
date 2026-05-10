import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PaymentsService } from '../services/payments.service';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

const receiptStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'receipts'),
  filename: (_req, file, cb) => {
    const name = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    cb(null, `${name}${extname(file.originalname)}`);
  },
});

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('invoices.pay_public')
  async createIntent(
    @CurrentUser() user: any,
    @Body() dto: {
      invoiceId: string;
      gatewayName: string;
      amount: number;
      currency?: string;
      successUrl?: string;
      cancelUrl?: string;
    },
  ) {
    return this.paymentsService.createPayment(dto);
  }

  @Post('create-element-intent')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('invoices.pay_public')
  async createElementIntent(
    @CurrentUser() user: any,
    @Body() dto: {
      invoiceId: string;
      amount: number;
      currency?: string;
    },
  ) {
    return this.paymentsService.createElementPayment(dto);
  }

  @Post('upload-receipt')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('invoices.pay_public')
  @UseInterceptors(FileInterceptor('receipt', { storage: receiptStorage }))
  async uploadReceipt(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('paymentId') paymentId: string,
  ) {
    if (!file) throw new BadRequestException('Receipt image is required');
    if (!paymentId) throw new BadRequestException('paymentId is required');
    const path = `/uploads/receipts/${file.filename}`;
    return this.paymentsService.attachReceipt(paymentId, path);
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

  @Get('public-config')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('invoices.pay_public')
  async getPublicConfig() {
    return this.paymentsService.getPublicConfig();
  }

  @Get('gateways-public')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('invoices.pay_public')
  async getPublicGateways() {
    return this.paymentsService.getPublicGateways();
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
