import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { AdminProposalsService } from "../services/admin-proposals.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AdminProposalsQueryDto } from "../dto/admin-proposals.dto";

@Controller("admin/proposals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminProposalsController {
  constructor(private readonly service: AdminProposalsService) {}

  @Get()
  @RequirePermissions("admin.proposals.read")
  findAll(@Query() q: AdminProposalsQueryDto) {
    return this.service.findAll(q);
  }

  @Get("stats")
  @RequirePermissions("admin.proposals.read")
  getStats() {
    return this.service.getStats();
  }

  /** Capabilities describe the authenticated admin actor, not a proposal resource. */
  @Get("capabilities")
  @RequirePermissions("admin.proposals.read")
  getActorCapabilities(@CurrentUser("id") userId: string) {
    return this.service.getActorCapabilities(userId);
  }

  @Get(":id")
  @RequirePermissions("admin.proposals.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post(":id/convert-to-contract")
  @RequirePermissions("admin.proposals.intervene")
  convertToContract(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.service.convertToContract(id, userId);
  }
}
