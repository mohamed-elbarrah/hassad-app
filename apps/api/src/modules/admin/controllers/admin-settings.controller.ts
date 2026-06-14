import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { AdminSettingsService } from "../services/admin-settings.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/settings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  @RequirePermissions("admin.settings")
  getAll() {
    return this.settingsService.getAll();
  }

  @Post()
  @RequirePermissions("admin.settings")
  updateBatch(@Body() updates: Record<string, any>) {
    return this.settingsService.updateBatch(updates);
  }

  @Post("seed-defaults")
  @RequirePermissions("admin.settings")
  seedDefaults() {
    return this.settingsService.ensureDefaults();
  }
}
