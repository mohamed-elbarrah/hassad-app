import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PaymentsService } from "../../payments/services/payments.service";
import { CurrencySettingsService } from "../../settings/services/currency-settings.service";
import { AiProviderService } from "../../ai/services/ai-provider.service";
import {
  CreateCurrencySettingDto,
  UpdateCurrencySettingDto,
} from "../../settings/dto/currency-setting.dto";
import {
  CreateAiProviderDto,
  FetchModelsDto,
  UpdateAiProviderDto,
} from "../../ai/dto/ai-provider.dto";
import {
  CreateAdminGatewayDto,
  UpdateAdminGatewayDto,
} from "../dto/admin-settings-configuration.dto";
import { CreateBankAccountDto } from "../../payments/dto/create-bank-account.dto";
import { UpdateBankAccountDto } from "../../payments/dto/update-bank-account.dto";

@Controller("admin/settings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSettingsConfigurationController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly currencies: CurrencySettingsService,
    private readonly ai: AiProviderService,
  ) {}

  @Get("payments")
  @RequirePermissions("admin.settings")
  async getPayments() {
    const [gateways, bankAccounts] = await Promise.all([
      this.payments.getGateways(),
      this.payments.getBankAccounts(true),
    ]);
    return {
      gateways: gateways.filter((gateway) => gateway.name === "stripe"),
      bankTransfer: gateways.find((gateway) => gateway.name === "bank_transfer") ?? null,
      bankAccounts,
    };
  }

  @Post("payments")
  @RequirePermissions("admin.settings")
  createPayment(@Body() dto: CreateAdminGatewayDto) {
    const { name, ...config } = dto;
    return this.payments.updateGatewayConfig(name, config);
  }

  @Patch("payments/:id")
  @RequirePermissions("admin.settings")
  updatePayment(@Param("id") id: string, @Body() dto: UpdateAdminGatewayDto) {
    return this.payments.updateGatewayConfig(id, dto);
  }

  @Delete("payments/:id")
  @RequirePermissions("admin.settings")
  deletePayment(@Param("id") id: string) {
    if (id === "bank_transfer") {
      return this.payments.updateGatewayConfig(id, { isActive: false });
    }
    return this.payments.deleteGateway(id);
  }

  @Get("payments/bank-accounts")
  @RequirePermissions("admin.settings")
  getBankAccounts() {
    return this.payments.getBankAccounts(true);
  }

  @Post("payments/bank-accounts")
  @RequirePermissions("admin.settings")
  createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.payments.createBankAccount(dto);
  }

  @Patch("payments/bank-accounts/:id")
  @RequirePermissions("admin.settings")
  updateBankAccount(@Param("id") id: string, @Body() dto: UpdateBankAccountDto) {
    return this.payments.updateBankAccount(id, dto);
  }

  @Delete("payments/bank-accounts/:id")
  @RequirePermissions("admin.settings")
  deleteBankAccount(@Param("id") id: string) {
    return this.payments.deleteBankAccount(id);
  }

  @Get("currencies")
  @RequirePermissions("admin.settings")
  getCurrencies() {
    return this.currencies.findAll();
  }

  @Get("currencies/:id")
  @RequirePermissions("admin.settings")
  getCurrency(@Param("id") id: string) {
    return this.currencies.findOne(id);
  }

  @Post("currencies")
  @RequirePermissions("admin.settings")
  createCurrency(@Body() dto: CreateCurrencySettingDto) {
    return this.currencies.create(dto);
  }

  @Patch("currencies/:id")
  @RequirePermissions("admin.settings")
  updateCurrency(@Param("id") id: string, @Body() dto: UpdateCurrencySettingDto) {
    return this.currencies.update(id, dto);
  }

  @Delete("currencies/:id")
  @RequirePermissions("admin.settings")
  deleteCurrency(@Param("id") id: string) {
    return this.currencies.delete(id);
  }

  @Post("currencies/upload-svg")
  @RequirePermissions("admin.settings")
  @UseInterceptors(FileInterceptor("file"))
  uploadCurrencySvg(
    @UploadedFile() file: Express.Multer.File,
    @Query("key") key?: string,
  ) {
    if (!file) throw new Error("SVG file is required");
    return this.currencies.uploadSvg(file, key || file.originalname);
  }

  @Get("ai")
  @RequirePermissions("admin.ai.read")
  getAiProviders() {
    return this.ai.findAll();
  }

  @Get("ai/:id")
  @RequirePermissions("admin.ai.read")
  getAiProvider(@Param("id") id: string) {
    return this.ai.findOne(id);
  }

  @Post("ai/fetch-models")
  @RequirePermissions("admin.ai.manage")
  fetchAiModels(@Body() dto: FetchModelsDto) {
    return this.ai.fetchModelsPreview(dto);
  }

  @Post("ai")
  @RequirePermissions("admin.ai.manage")
  createAiProvider(@Body() dto: CreateAiProviderDto) {
    return this.ai.create(dto);
  }

  @Patch("ai/:id")
  @RequirePermissions("admin.ai.manage")
  updateAiProvider(@Param("id") id: string, @Body() dto: UpdateAiProviderDto) {
    return this.ai.update(id, dto);
  }

  @Delete("ai/:id")
  @RequirePermissions("admin.ai.manage")
  deleteAiProvider(@Param("id") id: string) {
    return this.ai.remove(id);
  }

  @Get("ai/:id/models")
  @RequirePermissions("admin.ai.read")
  listAiModels(@Param("id") id: string) {
    return this.ai.fetchModels(id);
  }

  @Post("ai/:id/test")
  @RequirePermissions("admin.ai.manage")
  testAiProvider(@Param("id") id: string) {
    return this.ai.testProvider(id);
  }
}
