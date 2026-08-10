import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";

import { CrmContractsWorkspaceQueryDto } from "../dto/crm-contracts.dto";
import { CrmContractsService } from "../services/crm-contracts.service";

@Controller("crm/contracts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmContractsController {
  constructor(private readonly service: CrmContractsService) {}

  @Get()
  @RequirePermissions("contracts.read")
  findAll(@Query() query: CrmContractsWorkspaceQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("contracts.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }
}
