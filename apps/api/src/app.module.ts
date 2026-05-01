import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";

// V2 Modules
import { CoreModule } from "./modules/core/core.module";
import { CrmModule } from "./modules/crm/crm.module";
import { ProposalsModule } from "./modules/proposals/proposals.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { PortalModule } from "./modules/portal/portal.module";

import { FinanceModule } from "./modules/finance/finance.module";
import { ChatModule } from "./modules/chat/chat.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AiModule } from "./modules/ai/ai.module";
import { SalesModule } from "./modules/sales/sales.module";
import { MarketingModule } from "./modules/marketing/marketing.module";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      global: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    
    // V2 Modules
    CoreModule,
    CrmModule,
    ProposalsModule,
    ContractsModule,
    ProjectsModule,
    TasksModule,
    PortalModule,
    MarketingModule,

    FinanceModule,
    ChatModule,
    NotificationsModule,
    AiModule,
    SalesModule,
  ],
})
export class AppModule {}
