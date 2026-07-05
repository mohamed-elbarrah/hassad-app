import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsController } from "./controllers/notifications.controller";
import { NotificationTemplatesController } from "./controllers/notification-templates.controller";
import { NotificationsService } from "./services/notifications.service";
import { NotificationTemplatesService } from "./services/notification-templates.service";
import { NotificationsGateway } from "./gateway/notifications.gateway";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev-secret",
      signOptions: { expiresIn: "1h" },
    }),
  ],
  controllers: [NotificationsController, NotificationTemplatesController],
  providers: [NotificationsService, NotificationTemplatesService, NotificationsGateway],
  exports: [NotificationsService, NotificationTemplatesService],
})
export class NotificationsModule {}
