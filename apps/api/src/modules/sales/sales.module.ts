import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ChatModule } from "../chat/chat.module";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { RequestsModule } from "../requests/requests.module";
import { CrmModule } from "../crm/crm.module";
import { ProjectsModule } from "../projects/projects.module";
import { FinanceModule } from "../finance/finance.module";
import { SalesClientsController } from "./sales-clients.controller";
import { SalesChatController } from "./sales-chat.controller";

@Module({
  imports: [
    PrismaModule,
    ChatModule,
    RequestsModule,
    CrmModule,
    ProjectsModule,
    FinanceModule,
  ],
  controllers: [SalesController, SalesClientsController, SalesChatController],
  providers: [SalesService],
})
export class SalesModule {}
