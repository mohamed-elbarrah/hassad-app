import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { UserRole } from "@hassad/shared";
import { NotificationsService } from "./notifications.service";
import { GetNotificationsDto } from "./dto/get-notifications.dto";
import { BroadcastNotificationDto } from "./dto/broadcast-notification.dto";

const INTERNAL_ROLES = [
  UserRole.ADMIN,
  UserRole.PM,
  UserRole.SALES,
  UserRole.EMPLOYEE,
  UserRole.MARKETING,
  UserRole.ACCOUNTANT,
];

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("my")
  @Roles(...INTERNAL_ROLES)
  getMyNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() dto: GetNotificationsDto,
  ) {
    return this.notificationsService.getMyNotifications(user.id, dto);
  }

  @Get("my/unread-count")
  @Roles(...INTERNAL_ROLES)
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch("read-all")
  @Roles(...INTERNAL_ROLES)
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(":id/read")
  @Roles(...INTERNAL_ROLES)
  markAsRead(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post("broadcast")
  @Roles(UserRole.ADMIN)
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }
}
