import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AdminBackupsService } from "../services/admin-backups.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/exports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBackupsController {
  constructor(private readonly service: AdminBackupsService) {}

  @Get(":type")
  @RequirePermissions("admin.settings")
  exportData(@Param("type") type: string) {
    return this.service.exportData(type);
  }
}
