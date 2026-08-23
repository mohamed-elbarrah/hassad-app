import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PmProjectsService } from "../services/pm-projects.service";
import {
  PmProjectsQueryDto,
  PmProjectStatusDto,
  PmProjectUpdateDto,
} from "../dto/pm-projects.dto";

@Controller("pm/projects")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PmProjectsController {
  constructor(private readonly service: PmProjectsService) {}

  @Get()
  @RequirePermissions("projects.read")
  list(
    @CurrentUser("id") userId: string,
    @Query() query: PmProjectsQueryDto,
  ) {
    return this.service.list(userId, query);
  }

  @Patch(":id")
  @RequirePermissions("projects.update")
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: PmProjectUpdateDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Patch(":id/status")
  @RequirePermissions("projects.update")
  updateStatus(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: PmProjectStatusDto,
  ) {
    return this.service.updateStatus(userId, id, dto.status);
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
