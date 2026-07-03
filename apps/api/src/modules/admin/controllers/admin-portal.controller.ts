import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { AdminPortalService } from "../services/admin-portal.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/portal")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminPortalController {
  constructor(private readonly service: AdminPortalService) {}

  @Get("overview") @RequirePermissions("admin.portal.read") getOverview() { return this.service.getOverview(); }
  @Get("clients") @RequirePermissions("admin.portal.read") findClients(@Query() q: any) { return this.service.findClients(q); }
  @Post("clients/:id/regenerate-token") @RequirePermissions("admin.portal.manage") regenerateToken(@Param("id") id: string) { return this.service.regeneratePortalToken(id); }
}
