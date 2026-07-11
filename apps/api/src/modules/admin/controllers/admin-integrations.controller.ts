import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { AdminIntegrationsService } from "../services/admin-integrations.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/integrations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminIntegrationsController {
  constructor(private readonly service: AdminIntegrationsService) {}

  @Get("webhook-logs")
  @RequirePermissions("admin.settings")
  getWebhookLogs(@Query() q: any) {
    return this.service.getWebhookLogs(q);
  }

  @Post("webhook-logs/:id/retry")
  @RequirePermissions("admin.settings")
  retryWebhook(@Param("id") id: string) {
    return this.service.retryWebhook(id);
  }

  @Get("ad-platforms")
  @RequirePermissions("admin.settings")
  getAdPlatforms() {
    return this.service.getAdPlatformConnections();
  }

  @Get("gateways")
  @RequirePermissions("admin.settings")
  getGateways() {
    return this.service.getGateways();
  }
}
