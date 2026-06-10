import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ProposalsController } from "./controllers/proposals.controller";
import { ProposalsService } from "./services/proposals.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { RequestsModule } from "../requests/requests.module";

@Module({
  imports: [
    NotificationsModule,
    RequestsModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
