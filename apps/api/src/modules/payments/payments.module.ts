import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { PaymentsService } from "./services/payments.service";
import { PaymentsController } from "./controllers/payments.controller";
import { WebhooksController } from "./controllers/webhooks.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { CrmModule } from "../crm/crm.module";

@Module({
  imports: [
    NotificationsModule,
    CrmModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
