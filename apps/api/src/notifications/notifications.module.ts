import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { TaskNotificationHandler } from "./handlers/task-notification.handler";
import { EscalationCronService } from "./cron/escalation.cron";

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    TaskNotificationHandler,
    EscalationCronService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
