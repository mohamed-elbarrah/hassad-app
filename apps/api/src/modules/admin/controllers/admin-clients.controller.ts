import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminClientsService } from "../services/admin-clients.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminClientsController {
  constructor(private readonly service: AdminClientsService) {}

  @Get()
  @RequirePermissions("admin.clients.read")
  findAll(@Query() q: any) {
    return this.service.findAll(q);
  }

  @Get(":id")
  @RequirePermissions("admin.clients.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }
}
