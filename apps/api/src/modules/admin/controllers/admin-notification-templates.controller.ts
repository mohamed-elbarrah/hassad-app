import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AdminNotificationTemplatesService } from "../services/admin-notification-templates.service";
import { UpdateNotificationTemplateDto } from "../dto/admin-notification-templates.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("admin/notification-templates")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminNotificationTemplatesController {
  constructor(private readonly service: AdminNotificationTemplatesService) {}

  @Get()
  @RequirePermissions("admin.notifications")
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get("event-types")
  @RequirePermissions("admin.notifications")
  getEventTypes() {
    return this.service.getEventTypes();
  }

  @Get(":id")
  @RequirePermissions("admin.notifications")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  @RequirePermissions("admin.notifications")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user?.id);
  }

  @Get(":id/logs")
  @RequirePermissions("admin.notifications")
  getLogs(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getLogs(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
