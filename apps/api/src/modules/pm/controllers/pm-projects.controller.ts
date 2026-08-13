import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PmProjectsService } from "../services/pm-projects.service";

@Controller("pm/projects")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PmProjectsController {
  constructor(private readonly service: PmProjectsService) {}

  @Get()
  @RequirePermissions("projects.read")
  list(@CurrentUser("id") userId: string) {
    return this.service.list(userId);
  }

  @Get(":id")
  @RequirePermissions("projects.read")
  detail(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.detail(userId, id);
  }

  @Get(":id/workspace")
  @RequirePermissions("projects.read")
  workspace(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.workspace(userId, id);
  }
}
