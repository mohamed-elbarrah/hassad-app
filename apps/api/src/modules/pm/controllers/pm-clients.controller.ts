import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { PmClientsService } from "../services/pm-clients.service";

@Controller("pm/clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PmClientsController {
  constructor(private readonly service: PmClientsService) {}

  @Get(":id/full")
  @RequirePermissions("clients.read")
  getFull(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.getFull(id, userId);
  }

  @Get(":id/team-view")
  @RequirePermissions("clients.read")
  getTeamView(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.getTeamView(id, userId);
  }
}
