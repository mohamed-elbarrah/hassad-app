import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminProposalsService } from "../services/admin-proposals.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/proposals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminProposalsController {
  constructor(private readonly service: AdminProposalsService) {}

  @Get()
  @RequirePermissions("admin.proposals.read")
  findAll(@Query() q: any) {
    return this.service.findAll(q);
  }

  @Get("stats")
  @RequirePermissions("admin.proposals.read")
  getStats() {
    return this.service.getStats();
  }

  @Get(":id")
  @RequirePermissions("admin.proposals.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }
}
