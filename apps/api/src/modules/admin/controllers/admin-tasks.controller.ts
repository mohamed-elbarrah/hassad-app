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

@Controller("admin/tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTasksController {
  constructor(private readonly service: AdminTasksService) {}

  @Get() @RequirePermissions("admin.tasks.read") findAll(@Query() q: any) {
    return this.service.findAll(q);
  }
  @Get(":id") @RequirePermissions("admin.tasks.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }
  @Post(":id/reassign") @RequirePermissions("admin.tasks.intervene") reassign(
    @Param("id") id: string,
    @Body("assigneeId") assigneeId: string,
    @Body("reason") reason: string,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.reassign(id, assigneeId, adminId, reason);
  }
  @Post(":id/force-transition")
  @RequirePermissions("admin.tasks.intervene")
  forceTransition(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.forceTransition(id, body.status, body.reason, adminId);
  }
}
