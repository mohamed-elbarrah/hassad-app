import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminProjectsService } from "../services/admin-projects.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/projects")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminProjectsController {
  constructor(private readonly service: AdminProjectsService) {}

  @Get() @RequirePermissions("admin.projects.read") findAll(@Query() q: any) {
    return this.service.findAll(q);
  }
  @Get(":id") @RequirePermissions("admin.projects.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }
  @Post(":id/reassign-pm")
  @RequirePermissions("admin.projects.intervene")
  reassignPm(@Param("id") id: string, @Body("pmUserId") pmUserId: string) {
    return this.service.reassignPm(id, pmUserId);
  }
  @Post(":id/archive") @RequirePermissions("admin.projects.intervene") archive(
    @Param("id") id: string,
  ) {
    return this.service.archive(id);
  }
  @Post(":id/force-status")
  @RequirePermissions("admin.projects.intervene")
  forceStatus(@Param("id") id: string, @Body() body: any) {
    return this.service.forceStatus(id, body.status, body.reason);
  }
}
