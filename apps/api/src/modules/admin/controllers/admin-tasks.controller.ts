import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AdminTasksService } from "../services/admin-tasks.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTasksController {
  constructor(private readonly service: AdminTasksService) {}

  @Get() @RequirePermissions("admin.tasks.read") findAll(@Query() q: any) { return this.service.findAll(q); }
  @Get(":id") @RequirePermissions("admin.tasks.read") findOne(@Param("id") id: string) { return this.service.findOne(id); }
  @Post(":id/reassign") @RequirePermissions("admin.tasks.intervene") reassign(@Param("id") id: string, @Body("assigneeId") assigneeId: string) { return this.service.reassign(id, assigneeId); }
  @Post(":id/force-transition") @RequirePermissions("admin.tasks.intervene") forceTransition(@Param("id") id: string, @Body() body: any) { return this.service.forceTransition(id, body.status, body.reason); }
}
