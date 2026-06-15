import { Module } from "@nestjs/common";
import { FinanceController } from "./controllers/finance.controller";
import { FinanceService } from "./services/finance.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { CrmModule } from "../crm/crm.module";

@Module({
  imports: [NotificationsModule, CrmModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
