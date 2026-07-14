import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { AdminSystemEventsService } from "../services/admin-system-events.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("admin/events")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSystemEventsController {
  constructor(private readonly service: AdminSystemEventsService) {}

  @Get()
  @RequirePermissions("admin.settings")
  findAll(@Query() q: any) {
    return this.service.findAll(q);
  }

  @Get("stats")
  @RequirePermissions("admin.settings")
  getStats() {
    return this.service.getStats();
  }

  @Post(":id/resolve")
  @RequirePermissions("admin.settings")
  resolve(@Param("id") id: string, @CurrentUser() user: any) {
    return this.service.resolve(id, user.id);
  }
}
