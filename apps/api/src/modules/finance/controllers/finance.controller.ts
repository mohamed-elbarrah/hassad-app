import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Delete,
} from "@nestjs/common";
import { FinanceService } from "../services/finance.service";
import {
  FinanceMetricsDto,
  DateRangeDto,
  TopClientsDto,
  RevenueTrendDto,
  CreateInvoiceDto,
  CreateTicketDto,
  RegisterPaymentDto,
  RunPayrollDto,
  PaySalaryDto,
  UpdateSalaryDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from "../dto/finance.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get("finance/summary")
  @RequirePermissions("finance.read")
  getSummary() {
    return this.financeService.getSummary();
  }

  @Get("finance/metrics")
  @RequirePermissions("finance.read")
  getMetrics(@Query() dto: FinanceMetricsDto) {
    return this.financeService.getMetrics(dto);
  }

  @Get("finance/aging")
  @RequirePermissions("finance.read")
  getAging() {
    return this.financeService.getAging();
  }

  @Get("finance/actions")
  @RequirePermissions("finance.read")
  getActions() {
    return this.financeService.getActions();
  }

  @Get("finance/payment-methods")
  @RequirePermissions("finance.read")
  getPaymentMethods(@Query() dto: DateRangeDto) {
    return this.financeService.getPaymentMethodDistribution(dto);
  }
  @Get("finance/top-clients")
  @RequirePermissions("finance.read")
  getTopClients(@Query() dto: TopClientsDto) {
    return this.financeService.getTopClients(dto);
  }

  @Get("finance/revenue-trend")
  @RequirePermissions("finance.read")
  getRevenueTrend(@Query() dto: RevenueTrendDto) {
    return this.financeService.getRevenueTrend(dto);
  }

  @Get("finance/cashflow")
  @RequirePermissions("finance.read")
  getCashFlow(@Query() dto: DateRangeDto) {
    return this.financeService.getCashFlow(dto);
  }

  @Get("finance/alerts")
  @RequirePermissions("finance.read")
  getAlerts() {
    return this.financeService.getAlerts();
  }

  @Post("invoices")
  @RequirePermissions("finance.create_invoice")
  createInvoice(@CurrentUser() user: any, @Body() dto: CreateInvoiceDto) {
    return this.financeService.createInvoice(user.id, dto);
  }

  @Get("invoices")
  @RequirePermissions("finance.read")
  findAllInvoices(@Query() filters: any) {
    return this.financeService.findAllInvoices(filters);
  }

  @Get("invoices/:id")
  @RequirePermissions("finance.read")
  findInvoice(@Param("id") id: string) {
    return this.financeService.findInvoice(id);
  }

  @Post("invoices/:id/send")
  @RequirePermissions("finance.update_invoice")
  sendInvoice(@Param("id") id: string) {
    return this.financeService.sendInvoice(id);
  }

  @Patch("invoices/:id/pay")
  @RequirePermissions("finance.update_invoice")
  payInvoice(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.financeService.registerPayment(user.id, {
      invoiceId: id,
      amount: dto.amount,
      method: dto.method,
      notes: dto.notes,
    });
  }

  @Post("invoices/:id/pay-public")
  @RequirePermissions("invoices.pay_public")
  payInvoicePublic(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.financeService.registerPayment(user.id, {
      invoiceId: id,
      amount: dto.amount,
      method: dto.method,
      notes: dto.notes,
    });
  }

  @Post("payments")
  @RequirePermissions("finance.update_invoice")
  registerPayment(@CurrentUser() user: any, @Body() dto: RegisterPaymentDto) {
    return this.financeService.registerPayment(user.id, dto);
  }

  @Get("payments")
  @RequirePermissions("finance.read")
  findAllPayments(@Query() filters: any) {
    return this.financeService.findAllPayments(filters);
  }

  @Get("payroll")
  @RequirePermissions("finance.read")
  findAllEmployees() {
    return this.financeService.findAllEmployees();
  }

  @Post("payroll/run")
  @RequirePermissions("finance.manage_payroll")
  runPayroll(@CurrentUser() user: any, @Body() dto: RunPayrollDto) {
    return this.financeService.runPayroll(user.id, dto);
  }

  @Get("payroll/:id")
  @RequirePermissions("finance.read")
  findEmployeeById(@Param("id") id: string) {
    return this.financeService.findEmployeeById(id);
  }

  @Post("payroll/salaries/:id/pay")
  @RequirePermissions("finance.manage_payroll")
  paySalary(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: PaySalaryDto,
  ) {
    return this.financeService.paySalary(user.id, id, dto);
  }

  @Patch("payroll/salaries/:id")
  @RequirePermissions("finance.manage_payroll")
  updateSalary(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: UpdateSalaryDto,
  ) {
    return this.financeService.updateSalary(user.id, id, dto);
  }

  @Post("payroll/pay-all")
  @RequirePermissions("finance.manage_payroll")
  payAllSalaries(@CurrentUser() user: any, @Body() dto: RunPayrollDto) {
    return this.financeService.payAllSalaries(user.id, dto);
  }

  @Get("payroll/preview")
  @RequirePermissions("finance.read")
  previewPayroll(@Query() dto: RunPayrollDto) {
    return this.financeService.previewPayroll(dto);
  }

  @Post("employees")
  @RequirePermissions("finance.manage_payroll")
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.financeService.createEmployee(dto);
  }

  @Patch("employees/:id")
  @RequirePermissions("finance.manage_payroll")
  updateEmployee(@Param("id") id: string, @Body() dto: UpdateEmployeeDto) {
    return this.financeService.updateEmployee(id, dto);
  }

  @Delete("employees/:id")
  @RequirePermissions("finance.manage_payroll")
  deleteEmployee(@Param("id") id: string) {
    return this.financeService.deleteEmployee(id);
  }

  @Get("finance/contracts")
  @RequirePermissions("finance.read")
  findAllContracts() {
    return this.financeService.findAllContracts();
  }

  @Get("finance/overdue")
  @RequirePermissions("finance.read")
  getOverdueInvoices() {
    return this.financeService.getOverdueInvoices();
  }

  @Get("finance/contracts/billing-summary")
  @RequirePermissions("finance.read")
  getContractBillingSummary() {
    return this.financeService.getContractBillingSummary();
  }

  @Get("finance/ledger")
  @RequirePermissions("finance.read_ledger")
  getLedger(@Query() filters: any) {
    return this.financeService.getLedger(filters);
  }

  @Post("payment-tickets")
  @RequirePermissions("finance.manage_tickets")
  createTicket(@Body() dto: CreateTicketDto) {
    return this.financeService.createTicket(dto);
  }

  @Get("payment-tickets")
  @RequirePermissions("finance.read")
  findAllTickets(@Query() filters: any) {
    return this.financeService.findAllTickets(filters);
  }

  @Get("payment-tickets/:id")
  @RequirePermissions("finance.read")
  findOneTicket(@Param("id") id: string) {
    return this.financeService.findTicket(id);
  }

  @Patch("payment-tickets/:id/resolve")
  @RequirePermissions("finance.manage_tickets")
  resolveTicket(@Param("id") id: string) {
    return this.financeService.resolveTicket(id);
  }
}
