import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { CrmOverviewQueryDto } from "../dto/crm-overview.dto";
import { CrmOverviewService } from "../services/crm-overview.service";

@Controller("crm/overview")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmOverviewController {
  constructor(private readonly service: CrmOverviewService) {}

  @Get()
  @RequirePermissions("leads.read")
  findAll(@Query() query: CrmOverviewQueryDto) {
    return this.service.findAll(query);
  }
}
