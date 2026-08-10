import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";

import { CrmClientsWorkspaceQueryDto } from "../dto/crm-clients.dto";
import { CrmClientsService } from "../services/crm-clients.service";

@Controller("crm/clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmClientsController {
  constructor(private readonly service: CrmClientsService) {}

  @Get()
  @RequirePermissions("clients.read")
  getWorkspace(@Query() query: CrmClientsWorkspaceQueryDto) {
    return this.service.getWorkspace(query);
  }
}
