import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  PortalDisputesController,
  PmDisputesController,
  AdminDisputesController,
} from "./controllers";
import {
  DisputesService,
  DisputesNotificationsService,
  DisputesScheduler,
} from "./services";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5,
      },
    }),
    NotificationsModule,
    ProjectsModule,
  ],
  controllers: [
    PortalDisputesController,
    PmDisputesController,
    AdminDisputesController,
  ],
  providers: [DisputesService, DisputesNotificationsService, DisputesScheduler],
  exports: [DisputesService],
})
export class DisputesModule {}
