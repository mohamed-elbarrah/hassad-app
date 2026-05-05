import { Module } from "@nestjs/common";
import { ProposalsController } from "./controllers/proposals.controller";
import { ProposalsService } from "./services/proposals.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { RequestsModule } from "../requests/requests.module";

@Module({
  imports: [NotificationsModule, RequestsModule],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
