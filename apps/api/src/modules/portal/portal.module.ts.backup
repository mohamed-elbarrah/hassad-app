import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { PortalController } from "./controllers/portal.controller";
import { PortalNotificationsController } from "./controllers/portal-notifications.controller";
import { PortalService } from "./services/portal.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { MarketingModule } from "../marketing/marketing.module";

@Module({
  imports: [
    NotificationsModule,
    MarketingModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [PortalController, PortalNotificationsController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
