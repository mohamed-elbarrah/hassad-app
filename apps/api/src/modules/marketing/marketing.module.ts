import { Module } from "@nestjs/common";
import { CampaignsService } from "./services/campaigns.service";
import { MarketingStrategyService } from "./services/marketing-strategy.service";
import {
  CampaignsController,
  TaskCampaignsController,
} from "./controllers/campaigns.controller";
import {
  TaskMarketingStrategyController,
  MarketingStrategiesController,
} from "./controllers/marketing-strategy.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { StorageModule } from "../../common/storage/storage.module";

@Module({
  imports: [NotificationsModule, StorageModule],
  controllers: [
    CampaignsController,
    TaskCampaignsController,
    TaskMarketingStrategyController,
    MarketingStrategiesController,
  ],
  providers: [CampaignsService, MarketingStrategyService],
  exports: [CampaignsService, MarketingStrategyService],
})
export class MarketingModule {}