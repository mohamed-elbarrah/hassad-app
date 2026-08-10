import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";

import { CrmProposalsWorkspaceQueryDto } from "../dto/crm-proposals.dto";
import { CrmProposalsService } from "../services/crm-proposals.service";

@Controller("crm/proposals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmProposalsController {
  constructor(private readonly service: CrmProposalsService) {}

  @Get()
  @RequirePermissions("proposals.read")
  findAll(@Query() query: CrmProposalsWorkspaceQueryDto) {
    return this.service.findAll(query);
  }
}
