import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { AdminCrmOrdersService } from "../services/admin-crm-orders.service";

@Controller("admin/crm/orders")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminCrmOrdersController {
  constructor(private readonly service: AdminCrmOrdersService) {}

  @Get(":id")
  @RequirePermissions("admin.leads.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }
}
