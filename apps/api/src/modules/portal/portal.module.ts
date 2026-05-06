import { Module } from '@nestjs/common';
import { PortalController } from './controllers/portal.controller';
import { PortalNotificationsController } from './controllers/portal-notifications.controller';
import { PortalService } from './services/portal.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PortalController, PortalNotificationsController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
