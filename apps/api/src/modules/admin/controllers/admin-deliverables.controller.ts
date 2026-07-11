import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminDeliverablesService } from "../services/admin-deliverables.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminDeliverablesController {
  constructor(private readonly service: AdminDeliverablesService) {}

  @Get("deliverables")
  @RequirePermissions("admin.projects")
  getAll(@Query() query: any) {
    return this.service.getAll(query);
  }

  @Get("revision-requests")
  @RequirePermissions("admin.projects")
  getRevisionRequests(@Query() query: any) {
    return this.service.getRevisionRequests(query);
  }
}
