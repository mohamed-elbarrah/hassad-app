import { Module } from "@nestjs/common";
import { ChatModule } from "../chat/chat.module";
import { LeadsController } from "./controllers/leads.controller";
import { LeadsService } from "./services/leads.service";
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
import { CrmChatService } from "./services/crm-chat.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { RequestsModule } from "../requests/requests.module";

@Module({
  imports: [ChatModule, NotificationsModule, RequestsModule],
  controllers: [
    LeadsController,
    ClientsController,
    AutomationController,
    ClientProfileController,
    CrmClientsController,
    CrmProposalsController,
    CrmContractsController,
    CrmChatController,
  ],
  providers: [
    LeadsService,
    ClientsService,
    AutomationService,
    ClientProfileService,
    ClientCounterService,
    CrmClientsService,
    CrmProposalsService,
    CrmContractsService,
    CrmChatService,
  ],
  exports: [
    LeadsService,
    ClientsService,
    ClientProfileService,
    ClientCounterService,
    CrmClientsService,
    CrmProposalsService,
    CrmContractsService,
    CrmChatService,
  ],
})
export class CrmModule {}
