import { Controller, Get, Query, Param, UseGuards } from "@nestjs/common";
import { AdminReportsService } from "../services/admin-reports.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  @Get("sales")
  @RequirePermissions("admin.reports")
  getSalesReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.getSalesReport(from, to);
  }

  @Get("revenue")
  @RequirePermissions("admin.reports")
  getRevenueReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.getRevenueReport(from, to);
  }

  @Get("projects")
  @RequirePermissions("admin.reports")
  getProjectsReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
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
  getCampaignsReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.getCampaignsReport(from, to);
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
