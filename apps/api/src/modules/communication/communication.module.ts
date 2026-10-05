import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import {
  AdminAnnouncementsController,
  AdminIssuesController,
  DashboardAnnouncementsController,
  DashboardIssuesController,
  PortalAnnouncementsController,
  PortalIssuesController,
} from "./controllers/communication.controllers";
import { CommunicationService } from "./services/communication.service";
import { StorageModule } from "../../common/storage/storage.module";

@Module({
  imports: [PrismaModule, StorageModule, NotificationsModule],
  controllers: [
    AdminAnnouncementsController,
    DashboardAnnouncementsController,
    PortalAnnouncementsController,
    AdminIssuesController,
    DashboardIssuesController,
    PortalIssuesController,
  ],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
