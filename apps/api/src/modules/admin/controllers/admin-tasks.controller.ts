import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminTasksService } from "../services/admin-tasks.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  AdminForceTransitionDto,
  AdminReassignTaskDto,
  AdminTasksQueryDto,
} from "../dto/admin-tasks.dto";

@Controller("admin/tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTasksController {
  constructor(private readonly service: AdminTasksService) {}

  @Get()
  @RequirePermissions("admin.tasks.read")
  findAll(@Query() q: AdminTasksQueryDto) {
    return this.service.findAll(q);
  }
  @Get("stats")
  @RequirePermissions("admin.tasks.read")
  getStats(@Query() q: AdminTasksQueryDto) {
    return this.service.getStats(q);
  }

  /** Capabilities describe the authenticated admin actor, not a task resource. */
  @Get("capabilities")
  @RequirePermissions("admin.tasks.read")
  getActorCapabilities(@CurrentUser("id") userId: string) {
    return this.service.getActorCapabilities(userId);
  }

  @Get(":id") @RequirePermissions("admin.tasks.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }
  @Post(":id/reassign") @RequirePermissions("admin.tasks.intervene") reassign(
    @Param("id") id: string,
    @Body() body: AdminReassignTaskDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.reassign(id, body.assigneeId, adminId, body.reason);
  }
  @Post(":id/force-transition")
  @RequirePermissions("admin.tasks.intervene")
  forceTransition(
    @Param("id") id: string,
    @Body() body: AdminForceTransitionDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.forceTransition(id, body.status, body.reason, adminId);
  }
}
