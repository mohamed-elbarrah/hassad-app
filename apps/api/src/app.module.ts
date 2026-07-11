import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { StorageModule } from "./common/storage/storage.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RobustErrorLoggerService } from "./modules/health/services/robust-error-logger.service";
import { ThrottlerModule } from "@nestjs/throttler";

// V2 Modules
import { CoreModule } from "./modules/core/core.module";
import { CrmModule } from "./modules/crm/crm.module";
import { ProposalsModule } from "./modules/proposals/proposals.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { PortalModule } from "./modules/portal/portal.module";
import { RequestsModule } from "./modules/requests/requests.module";

import { FinanceModule } from "./modules/finance/finance.module";
import { ChatModule } from "./modules/chat/chat.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AiModule } from "./modules/ai/ai.module";
import { SalesModule } from "./modules/sales/sales.module";
import { MarketingModule } from "./modules/marketing/marketing.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ServicesModule } from "./modules/services/services.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { DisputesModule } from "./modules/disputes/disputes.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    StorageModule,
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      global: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,

    // Rate limiting (NEW)
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 }, // Default: 100 req/minute
      { ttl: 60000, limit: 5 }, // Login: 5 req/minute
      { ttl: 60000, limit: 3 }, // Register: 3 req/minute
      { ttl: 300000, limit: 2 }, // Forgot password: 2 req/5 minutes
      { ttl: 600000, limit: 10 }, // Reset password: 10 req/10 minutes
    ]),

    // V2 Modules
    CoreModule,
    CrmModule,
    ProposalsModule,
    ContractsModule,
    ProjectsModule,
    TasksModule,
    PortalModule,
    RequestsModule,
    MarketingModule,
    PaymentsModule,
    ServicesModule,
    SettingsModule,
    AdminModule,

    FinanceModule,
    ChatModule,
    NotificationsModule,
    AiModule,
    SalesModule,
    HealthModule,
    DisputesModule,
  ],
  providers: [
    RobustErrorLoggerService,
    {
      provide: "APP_FILTER",
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [RobustErrorLoggerService],
})
export class AppModule {}
