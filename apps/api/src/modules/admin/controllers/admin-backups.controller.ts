import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { AdminBackupsService } from "../services/admin-backups.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBackupsController {
  constructor(private readonly service: AdminBackupsService) {}

  // ── CSV exports ────────────────────────────────────────────────────
  @Get("exports/:type")
  @RequirePermissions("admin.settings")
  exportData(@Param("type") type: string) {
    return this.service.exportData(type);
  }

  // ── Backup management ───────────────────────────────────────────────
  @Post("backups/trigger")
  @RequirePermissions("admin.settings")
  triggerBackup(@CurrentUser() user: any) {
    return this.service.triggerBackup(user.id);
  }

  @Get("backups/status")
  @RequirePermissions("admin.settings")
  getBackupStatus() {
    return this.service.getBackupStatus();
  }

  @Get("backups/history")
  @RequirePermissions("admin.settings")
  getBackupHistory(@Query("limit") limit?: string) {
    return this.service.getBackupHistory(limit ? parseInt(limit) : 20);
  }
}
