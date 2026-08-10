import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";

import { SalesClientsWorkspaceQueryDto } from "../dto/sales-clients.dto";
import { SalesClientsService } from "../services/sales-clients.service";

@Controller("sales/clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesClientsController {
  constructor(private readonly service: SalesClientsService) {}

  @Get()
  @RequirePermissions("clients.read")
  getWorkspace(@Query() query: SalesClientsWorkspaceQueryDto) {
    return this.service.getWorkspace(query);
  }
}
