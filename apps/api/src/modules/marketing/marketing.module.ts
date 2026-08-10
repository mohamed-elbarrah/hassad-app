import { Module } from "@nestjs/common";
import { ChatModule } from "../chat/chat.module";
import { CampaignsService } from "./services/campaigns.service";
import { MarketingStrategyService } from "./services/marketing-strategy.service";
import { MarketingChatController } from "./controllers/marketing-chat.controller";
import { MarketingChatService } from "./services/marketing-chat.service";
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
  imports: [ChatModule, NotificationsModule, StorageModule],
  controllers: [
    CampaignsController,
    TaskCampaignsController,
    TaskMarketingStrategyController,
    MarketingStrategiesController,
    MarketingChatController,
  ],
  providers: [CampaignsService, MarketingStrategyService, MarketingChatService],
  exports: [CampaignsService, MarketingStrategyService, MarketingChatService],
})
export class MarketingModule {}
