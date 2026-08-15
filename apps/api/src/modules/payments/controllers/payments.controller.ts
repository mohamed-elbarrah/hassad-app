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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PaymentsService } from "../services/payments.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { StorageService } from "../../../common/storage/storage.service";
import { ApiException } from "../../../common/errors/api-error";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { UpdateGatewayDto } from "../dto/update-gateway.dto";
import { CreateBankAccountDto } from "../dto/create-bank-account.dto";
import { UpdateBankAccountDto } from "../dto/update-bank-account.dto";

@Controller("payments")
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
    @Body()
    dto: {
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

  @Post("create-element-intent")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("invoices.pay_public")
  async createElementIntent(
    @CurrentUser() user: any,
    @Body()
    dto: {
      invoiceId: string;
      amount: number;
      currency?: string;
    },
  ) {
    return this.paymentsService.createElementPayment(dto);
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
    if (!file) throw new ApiException("RECEIPT_IMAGE_REQUIRED", "Receipt image is required", 400);
    if (!paymentId) throw new ApiException("PAYMENT_ID_REQUIRED", "paymentId is required", 400);
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
    return this.paymentsService.attachReceipt(paymentId, uploadResult.key);
  }

  @Get("gateways")
  @RequirePermissions("finance.read")
  async getGateways() {
    return this.paymentsService.getGateways();
  }

  @Post("gateways/:name")
  @RequirePermissions("finance.admin")
  async updateGateway(@Param("name") name: string, @Body() dto: UpdateGatewayDto) {
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
  async updateBankAccount(@Param("id") id: string, @Body() dto: UpdateBankAccountDto) {
    return this.paymentsService.updateBankAccount(id, dto);
  }

  @Delete("bank-accounts/:id")
  @RequirePermissions("finance.admin")
  async deleteBankAccount(@Param("id") id: string) {
    return this.paymentsService.deleteBankAccount(id);
  }
}
