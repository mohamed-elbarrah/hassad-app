import { Module } from "@nestjs/common";
import { CampaignsService } from "./services/campaigns.service";
import {
  CampaignsController,
  TaskCampaignsController,
} from "./controllers/campaigns.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [CampaignsController, TaskCampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class MarketingModule {}
