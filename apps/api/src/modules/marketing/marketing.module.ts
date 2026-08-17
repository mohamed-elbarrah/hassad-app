import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
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
import { TasksModule } from "../tasks/tasks.module";
import { CrmModule } from "../crm/crm.module";
import { MarketingWorkspaceController } from "./controllers/marketing-workspace.controller";
import { MarketingWorkspaceService } from "./services/marketing-workspace.service";

@Module({
  imports: [ChatModule, NotificationsModule, StorageModule, TasksModule, CrmModule, MulterModule.register({ storage: memoryStorage() })],
  controllers: [
    CampaignsController,
    TaskCampaignsController,
    TaskMarketingStrategyController,
    MarketingStrategiesController,
    MarketingChatController,
    MarketingWorkspaceController,
  ],
  providers: [CampaignsService, MarketingStrategyService, MarketingChatService, MarketingWorkspaceService],
  exports: [CampaignsService, MarketingStrategyService, MarketingChatService],
})
export class MarketingModule {}
