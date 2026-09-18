import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { AdminFinanceService } from "../services/admin-finance.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AdminFinanceListQueryDto } from "../dto/admin-finance.dto";
import { ReviewPaymentDto } from "../../payments/dto/review-payment.dto";
import { UpdateGatewayDto } from "../../payments/dto/update-gateway.dto";
import { CreateBankAccountDto } from "../../payments/dto/create-bank-account.dto";
import { UpdateBankAccountDto } from "../../payments/dto/update-bank-account.dto";

@Controller("admin/finance")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminFinanceController {
  constructor(private readonly service: AdminFinanceService) {}

  // ── D1. Overview ──────────────────────────────────────────────────────────────
  @Get("overview")
  @RequirePermissions("admin.finance.read")
  getOverview() {
    return this.service.getOverview();
  }

  // ── D2. Finance screen read models ───────────────────────────────────────────
  @Get("invoices")
  @RequirePermissions("admin.finance.read")
  getInvoices(@Query() query: AdminFinanceListQueryDto) {
    return this.service.getInvoices(query);
  }

  @Get("invoices/:id/payment-details")
  @RequirePermissions("admin.finance.read")
  getInvoicePaymentDetails(@Param("id") id: string) {
    return this.service.getInvoicePaymentDetails(id);
  }

  @Get("payments")
  @RequirePermissions("admin.finance.read")
  getPayments(@Query() query: AdminFinanceListQueryDto) {
    return this.service.getPayments(query);
  }

  @Get("payroll")
  @RequirePermissions("admin.finance.read")
  getPayroll() {
    return this.service.getPayroll();
  }

  @Get("payment-issues")
  @RequirePermissions("admin.finance.read")
  getPaymentIssues(@Query() query: AdminFinanceListQueryDto) {
    return this.service.getPaymentIssues(query);
  }

  // ── D3. Invoice interventions ────────────────────────────────────────────────
  @Post("invoices/:id/force-status")
  @RequirePermissions("admin.finance.intervene")
  forceInvoiceStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("reason") reason: string,
    @CurrentUser() user: any,
  ) {
    return this.service.forceInvoiceStatus(id, status, reason, user.id);
  }

  @Post("invoices/:id/write-off")
  @RequirePermissions("admin.finance.intervene")
  writeOffInvoice(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @CurrentUser() user: any,
  ) {
    return this.service.writeOffInvoice(id, reason, user.id);
  }

  @Post("payments/:id/approve")
  @RequirePermissions("admin.finance.intervene")
  approvePayment(
    @Param("id") id: string,
    @Body() dto: ReviewPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reviewBankTransfer(id, user.id, "APPROVE", dto.reason);
  }

  @Post("payments/:id/reject")
  @RequirePermissions("admin.finance.intervene")
  rejectPayment(
    @Param("id") id: string,
    @Body() dto: ReviewPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reviewBankTransfer(id, user.id, "REJECT", dto.reason);
  }

  @Post("invoices/:id/refund")
  @RequirePermissions("admin.finance.intervene")
  triggerRefund(
    @Param("id") id: string,
    @Body("amount") amount: number,
    @Body("reason") reason: string,
    @CurrentUser() user: any,
  ) {
    return this.service.triggerRefund(id, amount, reason, user.id);
  }

  // ── D3. Payment Events ────────────────────────────────────────────────────────
  @Get("payment-events")
  @RequirePermissions("admin.finance.read")
  getPaymentEvents(@Query("paymentId") paymentId?: string) {
    return this.service.getPaymentEvents(paymentId);
  }

  // ── D3. Webhook Logs ──────────────────────────────────────────────────────────
  @Get("webhook-logs")
  @RequirePermissions("admin.finance.read")
  getWebhookLogs(@Query() filters: any) {
    return this.service.getWebhookLogs(filters);
  }

  @Post("webhook-logs/:id/retry")
  @RequirePermissions("admin.finance.intervene")
  retryWebhook(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @CurrentUser() user: any,
  ) {
    return this.service.retryWebhook(id, user.id, reason);
  }

  @Get("gateways")
  @RequirePermissions("admin.finance.read")
  getGateways() {
    return this.service.getGateways();
  }

  @Post("gateways/:name")
  @RequirePermissions("admin.finance.intervene")
  updateGateway(@Param("name") name: string, @Body() dto: UpdateGatewayDto) {
    return this.service.updateGateway(name, dto);
  }

  @Delete("gateways/:name")
  @RequirePermissions("admin.finance.intervene")
  deleteGateway(@Param("name") name: string) {
    return this.service.deleteGateway(name);
  }

  @Get("bank-accounts")
  @RequirePermissions("admin.finance.read")
  getBankAccounts(@Query("all") all?: string) {
    return this.service.getBankAccounts(all === "true");
  }

  @Post("bank-accounts")
  @RequirePermissions("admin.finance.intervene")
  createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.service.createBankAccount(dto);
  }

  @Patch("bank-accounts/:id")
  @RequirePermissions("admin.finance.intervene")
  updateBankAccount(
    @Param("id") id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.service.updateBankAccount(id, dto);
  }

  @Delete("bank-accounts/:id")
  @RequirePermissions("admin.finance.intervene")
  deleteBankAccount(@Param("id") id: string) {
    return this.service.deleteBankAccount(id);
  }

  // ── D3. Gateways Health ───────────────────────────────────────────────────────
  @Get("gateways-health")
  @RequirePermissions("admin.finance.read")
  getGatewaysHealth() {
    return this.service.getGatewaysHealth();
  }

  @Post("gateways-health/check")
  @RequirePermissions("admin.finance.intervene")
  checkGatewayHealth(@CurrentUser() user: any) {
    return this.service.checkGatewayHealth(user.id);
  }
}
