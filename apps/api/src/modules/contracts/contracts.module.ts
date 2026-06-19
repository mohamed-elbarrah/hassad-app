import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ContractsController } from "./controllers/contracts.controller";
import { ContractsService } from "./services/contracts.service";
import { ContractCronService } from "./services/contract-cron.service";
import { BillingCronService } from "./services/billing-cron.service";
import { PmAssignmentService } from "./services/pm-assignment.service";
import { ContractPaymentPlanService } from "./services/contract-payment-plan.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { CrmModule } from "../crm/crm.module";
import { RequestsModule } from "../requests/requests.module";
import { FinanceModule } from "../finance/finance.module";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [
    NotificationsModule,
    CrmModule,
    RequestsModule,
    FinanceModule,
    ChatModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [ContractsController],
  providers: [ContractsService, ContractCronService, BillingCronService, PmAssignmentService, ContractPaymentPlanService],
  exports: [ContractsService],
})
export class ContractsModule {}
