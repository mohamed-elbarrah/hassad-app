import { Module } from "@nestjs/common";
import { LeadsController } from "./controllers/leads.controller";
import { LeadsService } from "./services/leads.service";
import { ClientsController } from "./controllers/clients.controller";
import { ClientsService } from "./services/clients.service";
import { AutomationController } from "./controllers/automation.controller";
import { AutomationService } from "./services/automation.service";
import { ClientProfileController } from "./controllers/client-profile.controller";
import { ClientProfileService } from "./services/client-profile.service";
import { ClientCounterService } from "./services/client-counter.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { RequestsModule } from "../requests/requests.module";

@Module({
  imports: [NotificationsModule, RequestsModule],
  controllers: [
    LeadsController,
    ClientsController,
    AutomationController,
    ClientProfileController,
  ],
  providers: [
    LeadsService,
    ClientsService,
    AutomationService,
    ClientProfileService,
    ClientCounterService,
  ],
  exports: [
    LeadsService,
    ClientsService,
    ClientProfileService,
    ClientCounterService,
  ],
})
export class CrmModule {}
