import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { IntegrationsSettingsService } from "../../settings/services/integrations-settings.service";
import {
  R2SettingsDto,
  UpdateIntegrationsDto,
} from "../../settings/dto/integrations.dto";

@Controller("admin/settings/integrations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin.settings")
export class AdminIntegrationSettingsController {
  constructor(private readonly service: IntegrationsSettingsService) {}

  @Get()
  get() {
    return this.service.getAdminSettings();
  }

  @Patch()
  update(@Body() dto: UpdateIntegrationsDto) {
    return this.service.update(dto);
  }

  @Post("test-r2")
  testR2(@Body() dto: R2SettingsDto) {
    return this.service.testR2(dto);
  }
}
