import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { AdminReportsService } from "../services/admin-reports.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ReportPeriod } from "@prisma/client";
import { SnapshotGenerateDto, SnapshotQueryDto } from "../dto/admin-kpi.dto";

@Controller("admin/reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  @Get("sales")
  @RequirePermissions("admin.reports")
  getSalesReport(@Query("from") from?: string, @Query("to") to?: string) {
    return this.service.getSalesReport(from, to);
  }

  @Get("revenue")
  @RequirePermissions("admin.reports")
  getRevenueReport(@Query("from") from?: string, @Query("to") to?: string) {
    return this.service.getRevenueReport(from, to);
  }

  @Get("projects")
  @RequirePermissions("admin.reports")
  getProjectsReport(@Query("from") from?: string, @Query("to") to?: string) {
    return this.service.getProjectsReport(from, to);
  }

  @Get("team-performance")
  @RequirePermissions("admin.reports")
  getTeamPerformanceReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.getTeamPerformanceReport(from, to);
  }

  @Get("satisfaction")
  @RequirePermissions("admin.reports")
  getSatisfactionReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.getSatisfactionReport(from, to);
  }

  @Get("campaigns")
  @RequirePermissions("admin.reports")
  getCampaignsReport(@Query("from") from?: string, @Query("to") to?: string) {
    return this.service.getCampaignsReport(from, to);
  }

  // ── New report types ──────────────────────────────────────────────────────

  @Get("requests")
  @RequirePermissions("admin.reports")
  getRequestsReport(@Query("from") from?: string, @Query("to") to?: string) {
    return this.service.getRequestsReport(from, to);
  }

  @Get("clients")
  @RequirePermissions("admin.reports")
  getClientReport(@Query("from") from?: string, @Query("to") to?: string) {
    return this.service.getClientReport(from, to);
  }

  @Get("system-health")
  @RequirePermissions("admin.reports")
  getSystemHealthReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.getSystemHealthReport(from, to);
  }

  // ── Snapshot persistence ──────────────────────────────────────────────────

  @Post("snapshots")
  @RequirePermissions("admin.reports")
  saveSnapshot(@Body() dto: SnapshotGenerateDto) {
    return this.service.saveSnapshot(
      dto.reportType,
      dto.period as ReportPeriod,
    );
  }

  @Get("snapshots")
  @RequirePermissions("admin.reports")
  getSnapshots(@Query() q: SnapshotQueryDto) {
    return this.service.getSnapshots(q.reportType, q.period, q.limit);
  }

  @Get("export")
  @RequirePermissions("admin.reports")
  exportReport(
    @Query("type") type: string,
    @Query("format") format: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.exportReport(type, format, from, to);
  }
}
