import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { LeadFollowUpCronService } from "./cron/follow-up.cron";

/**
 * ClientsModule — encapsulates the CRM Clients feature.
 * PrismaModule is @Global(), so PrismaService is available without a local import.
 */
@Module({
  controllers: [ClientsController],
  providers: [ClientsService, LeadFollowUpCronService],
  exports: [ClientsService],
})
export class ClientsModule {}
