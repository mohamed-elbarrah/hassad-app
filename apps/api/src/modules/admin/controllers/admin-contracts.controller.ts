import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AdminContractsService } from "../services/admin-contracts.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/contracts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminContractsController {
  constructor(private readonly service: AdminContractsService) {}

  @Get() @RequirePermissions("admin.contracts.read") findAll(@Query() q: any) { return this.service.findAll(q); }
  @Get(":id") @RequirePermissions("admin.contracts.read") findOne(@Param("id") id: string) { return this.service.findOne(id); }
  @Post(":id/cancel") @RequirePermissions("admin.contracts.intervene") cancel(@Param("id") id: string, @Body("reason") reason: string) { return this.service.cancel(id, reason); }
  @Post(":id/trigger-renewal-alert") @RequirePermissions("admin.contracts.intervene") triggerRenewalAlert(@Param("id") id: string) { return this.service.triggerRenewalAlert(id); }
}
