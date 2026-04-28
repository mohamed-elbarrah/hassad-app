import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { BroadcastNotificationDto } from '../dto/notification.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications/my — paginated notifications for current user */
  @Get('my')
  @RequirePermissions('notifications.read')
  findMine(
    @CurrentUser() user: any,
    @Query() filters: { page?: number; limit?: number; isRead?: boolean },
  ) {
    return this.notificationsService.findAll(user.id, filters);
  }

  /** GET /notifications/my/unread-count */
  @Get('my/unread-count')
  @RequirePermissions('notifications.read')
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  /** PATCH /notifications/:id/read — mark single notification as read */
  @Patch(':id/read')
  @RequirePermissions('notifications.update')
  markOneRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markOneRead(user.id, id);
  }

  /** PATCH /notifications/read-all — mark all as read */
  @Patch('read-all')
  @RequirePermissions('notifications.update')
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }

  /** POST /notifications/broadcast — admin only */
  @Post('broadcast')
  @RequirePermissions('notifications.broadcast')
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast({
      title: dto.title,
      message: dto.message,
      roles: dto.roles,
      departments: dto.departments,
    });
  }
}
