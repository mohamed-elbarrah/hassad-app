import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminSecurityService } from "../services/admin-security.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { QuerySecurityEventsDto } from "../dto/admin-security.dto";

@Controller("admin/security")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSecurityController {
  constructor(
    private readonly adminSecurityService: AdminSecurityService,
  ) {}

  @Get("events")
  @RequirePermissions("admin.security.read")
  findEvents(@Query() query: QuerySecurityEventsDto) {
    return this.adminSecurityService.findEvents(query);
  }

  @Get("stats")
  @RequirePermissions("admin.security.read")
  getStats() {
    return this.adminSecurityService.getStats();
  }
}
