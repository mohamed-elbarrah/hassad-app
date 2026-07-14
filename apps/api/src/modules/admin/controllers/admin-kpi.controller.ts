import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminKpiService } from "../services/admin-kpi.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { KpiQueryDto } from "../dto/admin-kpi.dto";

@Controller("admin/kpi")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminKpiController {
  constructor(private readonly service: AdminKpiService) {}

  @Get("sales")
  @RequirePermissions("admin.reports")
  getSalesKpis(@Query() q: KpiQueryDto) {
    return this.service.getSalesKpis(q.from, q.to);
  }

  @Get("clients")
  @RequirePermissions("admin.reports")
  getClientKpis(@Query() q: KpiQueryDto) {
    return this.service.getClientKpis(q.from, q.to);
  }

  @Get("projects")
  @RequirePermissions("admin.reports")
  getProjectKpis(@Query() q: KpiQueryDto) {
    return this.service.getProjectKpis(q.from, q.to);
  }

  @Get("tasks")
  @RequirePermissions("admin.reports")
  getTaskKpis(@Query() q: KpiQueryDto) {
    return this.service.getTaskKpis(q.from, q.to);
  }

  @Get("system")
  @RequirePermissions("admin.reports")
  getSystemKpis(@Query() q: KpiQueryDto) {
    return this.service.getSystemKpis(q.from, q.to);
  }
}
