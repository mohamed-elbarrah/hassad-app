import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { AdminFeatureFlagsService } from "../services/admin-feature-flags.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/feature-flags")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminFeatureFlagsController {
  constructor(private readonly service: AdminFeatureFlagsService) {}

  @Get() @RequirePermissions("admin.settings")
  getAll() { return this.service.getAll(); }

  @Get("defaults") @RequirePermissions("admin.settings")
  getDefaults() { return this.service.getDefaults(); }

  @Post(":key") @RequirePermissions("admin.settings")
  update(@Param("key") key: string, @Body("enabled") enabled: boolean) { return this.service.update(key, enabled); }
}
