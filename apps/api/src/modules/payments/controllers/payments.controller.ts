import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PaymentsService } from "../services/payments.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { UpdateGatewayDto } from "../dto/update-gateway.dto";
import { CreateBankAccountDto } from "../dto/create-bank-account.dto";
import { UpdateBankAccountDto } from "../dto/update-bank-account.dto";
import { CreatePaymentIntentDto } from "../dto/create-payment-intent.dto";

@Controller("payments")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly storageService: StorageService,
  ) {}

  @Post("create-intent")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("invoices.pay_public")
  async createIntent(
    @CurrentUser() user: any,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    if (!dto.gatewayName) {
      throw new BadRequestException({
        code: "PAYMENT_GATEWAY_REQUIRED",
        details: {},
      });
    }
    return this.paymentsService.createPayment({
      invoiceId: dto.invoiceId,
      gatewayName: dto.gatewayName,
      amount: dto.amount,
      currency: dto.currency,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
      clientUserId: user.id,
    });
  }

  @Post("create-element-intent")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("invoices.pay_public")
  async createElementIntent(
    @CurrentUser() user: any,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createElementPayment({
      ...dto,
      clientUserId: user.id,
    });
  }

  @Post("upload-receipt")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("invoices.pay_public")
  @UseInterceptors(FileInterceptor("receipt"))
  async uploadReceipt(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("paymentId") paymentId: string,
  ) {
    if (!file) {
      throw new BadRequestException({ code: "FILE_REQUIRED", details: {} });
    }
    if (!paymentId) {
      throw new BadRequestException({
        code: "PAYMENT_ID_REQUIRED",
        details: {},
      });
    }
    await this.paymentsService.assertReceiptUploadAllowed(paymentId, user.id);
    const uploadResult = await this.storageService.upload({
      category: StorageCategory.RECEIPT,
      entityId: paymentId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      subPath: "receipts",
    });
    try {
      return await this.paymentsService.attachReceipt(
        paymentId,
        uploadResult.key,
        user.id,
      );
    } catch (error) {
      await this.storageService.deleteByKey(uploadResult.key);
      throw error;
    }
  }

  @Get("gateways")
  @RequirePermissions("finance.read")
  async getGateways() {
    return this.paymentsService.getGateways();
  }

  @Post("gateways/:name")
  @RequirePermissions("finance.admin")
  async updateGateway(
    @Param("name") name: string,
    @Body() dto: UpdateGatewayDto,
  ) {
    return this.paymentsService.updateGatewayConfig(name, dto);
  }

  @Delete("gateways/:name")
  @RequirePermissions("finance.admin")
  async deleteGateway(@Param("name") name: string) {
    return this.paymentsService.deleteGateway(name);
  }

  @Get("bank-accounts")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("finance.read")
  async getBankAccounts(@Query("all") all?: string) {
    return this.paymentsService.getBankAccounts(all === "true");
  }

  @Get("bank-accounts-public")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("invoices.pay_public")
  async getPublicBankAccounts() {
    return this.paymentsService.getPublicBankAccounts();
  }

  @Get("public-config")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("invoices.pay_public")
  async getPublicConfig() {
    return this.paymentsService.getPublicConfig();
  }

  @Get("gateways-public")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("invoices.pay_public")
  async getPublicGateways() {
    return this.paymentsService.getPublicGateways();
  }

  @Post("bank-accounts")
  @RequirePermissions("finance.admin")
  async createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.paymentsService.createBankAccount(dto);
  }

  @Patch("bank-accounts/:id")
  @RequirePermissions("finance.admin")
  async updateBankAccount(
    @Param("id") id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.paymentsService.updateBankAccount(id, dto);
  }

  @Delete("bank-accounts/:id")
  @RequirePermissions("finance.admin")
  async deleteBankAccount(@Param("id") id: string) {
    return this.paymentsService.deleteBankAccount(id);
  }
}
