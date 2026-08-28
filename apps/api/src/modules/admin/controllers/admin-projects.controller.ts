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
import {
  AdminCreateProjectDto,
  AdminProjectActionDto,
  AdminProjectDeliverablesQueryDto,
  AdminProjectMemberDto,
  AdminProjectReassignDto,
  AdminProjectsQueryDto,
  AdminProjectStatusDto,
  AdminProjectTaskDto,
  AdminProjectTasksQueryDto,
} from "../dto/admin-projects.dto";

@Controller("admin/projects")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminProjectsController {
  constructor(private readonly service: AdminProjectsService) {}

  @Get()
  @RequirePermissions("admin.projects.read")
  findAll(@Query() q: AdminProjectsQueryDto) {
    return this.service.findAll(q);
  }
  /** Capabilities describe the authenticated admin actor, not a project resource. */
  @Get("capabilities")
  @RequirePermissions("admin.projects.read")
  getActorCapabilities(@CurrentUser("id") userId: string) {
    return this.service.getActorCapabilities(userId);
  }

  @Get(":id") @RequirePermissions("admin.projects.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }

  @Get(":id/periods")
  @RequirePermissions("admin.projects.read")
  getPeriods(@Param("id") id: string) {
    return this.service.getPeriods(id);
  }

  @Get(":id/team")
  @RequirePermissions("admin.projects.read")
  getTeam(@Param("id") id: string) {
    return this.service.getTeam(id);
  }

  @Get(":id/deliverables")
  @RequirePermissions("admin.projects.read")
  getDeliverables(
    @Param("id") id: string,
    @Query() query: AdminProjectDeliverablesQueryDto,
  ) {
    return this.service.getDeliverables(id, query);
  }

  @Get(":id/tasks")
  @RequirePermissions("admin.projects.read")
  getTasks(
    @Param("id") id: string,
    @Query() query: AdminProjectTasksQueryDto,
  ) {
    return this.service.getTasks(id, query);
  }

  @Get(":id/timeline")
  @RequirePermissions("admin.projects.read")
  getTimeline(@Param("id") id: string) {
    return this.service.getTimeline(id);
  }
  @Post(":id/reassign-pm")
  @RequirePermissions("admin.projects.intervene")
  reassignPm(
    @Param("id") id: string,
    @Body() body: AdminProjectReassignDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.reassignPm(id, body.pmUserId, adminId, body.reason);
  }
  @Post(":id/archive") @RequirePermissions("admin.projects.intervene") archive(
    @Param("id") id: string,
    @Body() body: AdminProjectActionDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.archive(id, adminId, body.reason);
  }
  @Post(":id/unarchive")
  @RequirePermissions("admin.projects.intervene")
  unarchive(
    @Param("id") id: string,
    @Body() body: AdminProjectActionDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.unarchive(id, adminId, body.reason);
  }
  @Post(":id/force-status")
  @RequirePermissions("admin.projects.intervene")
  forceStatus(
    @Param("id") id: string,
    @Body() body: AdminProjectStatusDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.forceStatus(id, body.status, body.reason ?? "", adminId);
  }

  @Post()
  @RequirePermissions("admin.projects.create")
  create(@Body() body: AdminCreateProjectDto, @CurrentUser("id") adminId: string) {
    return this.service.create(body, adminId);
  }

  @Post(":id/members")
  @RequirePermissions("admin.projects.intervene")
  addMember(
    @Param("id") id: string,
    @Body() body: AdminProjectMemberDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.addMember(id, body.userId, body.role, adminId, body.reason);
  }

  @Post(":id/tasks")
  @RequirePermissions("admin.projects.intervene")
  addTask(
    @Param("id") id: string,
    @Body() body: AdminProjectTaskDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.addTask(id, body, adminId);
  }
}
