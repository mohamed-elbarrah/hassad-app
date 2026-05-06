import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { MarkReadDto } from "../../notifications/dto/notification.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("portal-notifications")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortalNotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @RequirePermissions("portal.read")
  findMine(
    @CurrentUser() user: any,
    @Query() filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    return this.notificationsService.findAll(user.id, filters);
  }

  @Get("unread-count")
  @RequirePermissions("portal.read")
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch("read-all")
  @RequirePermissions("portal.read")
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Post("mark-read")
  @RequirePermissions("portal.read")
  markRead(@CurrentUser() user: any, @Body() dto: MarkReadDto) {
    return this.notificationsService.markRead(user.id, dto.notificationIds);
  }

  @Patch(":id/read")
  @RequirePermissions("portal.read")
  markOneRead(@CurrentUser() user: any, @Param("id") id: string) {
    return this.notificationsService.markOneRead(user.id, id);
  }
}
