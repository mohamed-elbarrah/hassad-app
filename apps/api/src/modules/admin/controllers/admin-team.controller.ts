import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AdminTeamService } from "../services/admin-team.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/team")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTeamController {
  constructor(private readonly service: AdminTeamService) {}

  @Get("workload")
  @RequirePermissions("admin.team")
  getWorkload() {
    return this.service.getWorkload();
  }

  @Get("workload/:userId")
  @RequirePermissions("admin.team")
  getWorkloadByUser(@Param("userId") userId: string) {
    return this.service.getWorkloadByUser(userId);
  }
}
