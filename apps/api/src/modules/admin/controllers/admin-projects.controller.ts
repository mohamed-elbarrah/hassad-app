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
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

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

  @Post()
  @RequirePermissions("admin.projects.create")
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post(":id/members")
  @RequirePermissions("admin.projects.intervene")
  addMember(
    @Param("id") id: string,
    @Body("userId") userId: string,
    @Body("role") role: string,
  ) {
    return this.service.addMember(id, userId, role);
  }

  @Post(":id/tasks")
  @RequirePermissions("admin.projects.intervene")
  addTask(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.addTask(id, body, adminId);
  }
}
