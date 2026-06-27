import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { PortalController } from "./controllers/portal.controller";
import { PortalNotificationsController } from "./controllers/portal-notifications.controller";
import { PortalService } from "./services/portal.service";
import { SnoozeReminderScheduler } from "./services/snooze-reminder.scheduler";
import { NotificationsModule } from "../notifications/notifications.module";
import { MarketingModule } from "../marketing/marketing.module";

@Module({
  imports: [
    NotificationsModule,
    MarketingModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
        files: 10,
      },
    }),
  ],
  controllers: [PortalController, PortalNotificationsController],
  providers: [PortalService, SnoozeReminderScheduler],
  exports: [PortalService],
})
export class PortalModule {}
