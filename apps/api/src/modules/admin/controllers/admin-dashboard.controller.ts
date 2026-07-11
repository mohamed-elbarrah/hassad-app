import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminDashboardService } from "../services/admin-dashboard.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get("attention")
  @RequirePermissions("admin.dashboard")
  getAttention() {
    return this.service.getAttention();
  }

  @Get("recent-activity")
  @RequirePermissions("admin.dashboard")
  getRecentActivity(@Query("limit") limit?: string) {
    return this.service.getRecentActivity(limit ? Number(limit) : undefined);
  }

  @Get("team-workload")
  @RequirePermissions("admin.dashboard")
  getTeamWorkload() {
    return this.service.getTeamWorkload();
  }
}
