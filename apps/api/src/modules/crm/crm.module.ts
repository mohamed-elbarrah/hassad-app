import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ChatModule } from "../chat/chat.module";
import { ClientsController } from "./controllers/clients.controller";
import { ClientsService } from "./services/clients.service";
import { AutomationController } from "./controllers/automation.controller";
import { AutomationService } from "./services/automation.service";
import { ClientProfileController } from "./controllers/client-profile.controller";
import { ClientProfileService } from "./services/client-profile.service";
import { ClientCounterService } from "./services/client-counter.service";
import { CrmClientsController } from "./controllers/crm-clients.controller";
import { CrmClientsService } from "./services/crm-clients.service";
import { CrmProposalsController } from "./controllers/crm-proposals.controller";
import { CrmProposalsService } from "./services/crm-proposals.service";
import { CrmContractsController } from "./controllers/crm-contracts.controller";
import { CrmContractsService } from "./services/crm-contracts.service";
import { CrmChatController } from "./controllers/crm-chat.controller";
import { CrmOverviewController } from "./controllers/crm-overview.controller";
import { CrmOrdersController } from "./controllers/crm-orders.controller";
import { CrmRequestsController } from "./controllers/crm-requests.controller";
import { CrmChatService } from "./services/crm-chat.service";
import { CrmOverviewService } from "./services/crm-overview.service";
import { CrmOrdersService } from "./services/crm-orders.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { RequestsModule } from "../requests/requests.module";

@Module({
  imports: [
    ChatModule,
    NotificationsModule,
    RequestsModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [
    ClientsController,
    AutomationController,
    ClientProfileController,
    CrmClientsController,
    CrmProposalsController,
    CrmContractsController,
    CrmChatController,
    CrmOverviewController,
    CrmOrdersController,
    CrmRequestsController,
  ],
  providers: [
    ClientsService,
    AutomationService,
    ClientProfileService,
    ClientCounterService,
    CrmClientsService,
    CrmProposalsService,
    CrmContractsService,
    CrmChatService,
    CrmOverviewService,
    CrmOrdersService,
  ],
  exports: [
    ClientsService,
    ClientProfileService,
    ClientCounterService,
    CrmClientsService,
    CrmProposalsService,
    CrmContractsService,
    CrmChatService,
    CrmOverviewService,
    CrmOrdersService,
  ],
})
export class CrmModule {}
