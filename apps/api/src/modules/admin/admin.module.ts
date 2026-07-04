import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { FinanceModule } from "../finance/finance.module";
import { TerminusModule } from "@nestjs/terminus";

import { AdminController } from "./controllers/admin.controller";
import { AdminAuditController } from "./controllers/admin-audit.controller";
import { AdminSettingsController } from "./controllers/admin-settings.controller";
import { AdminUsersController } from "./controllers/admin-users.controller";
import { AdminSessionsController } from "./controllers/admin-sessions.controller";
import { AdminSecurityController } from "./controllers/admin-security.controller";
import { AdminProjectsController } from "./controllers/admin-projects.controller";
import { AdminTasksController } from "./controllers/admin-tasks.controller";
import { AdminContractsController } from "./controllers/admin-contracts.controller";
import { AdminLeadsController } from "./controllers/admin-leads.controller";
import { AdminRequestsController } from "./controllers/admin-requests.controller";
import { AdminCampaignsController } from "./controllers/admin-campaigns.controller";
import { AdminChatController } from "./controllers/admin-chat.controller";
import { AdminPortalController } from "./controllers/admin-portal.controller";
import { AdminFinanceController } from "./controllers/admin-finance.controller";
import { AdminProposalsController } from "./controllers/admin-proposals.controller";
import { AdminClientsController } from "./controllers/admin-clients.controller";
import { AdminIntegrationsController } from "./controllers/admin-integrations.controller";
import { AdminAutomationController } from "./controllers/admin-automation.controller";
import { AdminFeatureFlagsController } from "./controllers/admin-feature-flags.controller";
import { AdminEnvironmentController } from "./controllers/admin-environment.controller";
import { AdminBackupsController } from "./controllers/admin-backups.controller";

import { AdminService } from "./services/admin.service";
import { AdminAuditService } from "./services/admin-audit.service";
import { AdminSettingsService } from "./services/admin-settings.service";
import { AdminUsersService } from "./services/admin-users.service";
import { AdminSessionsService } from "./services/admin-sessions.service";
import { AdminSecurityService } from "./services/admin-security.service";
import { AdminProjectsService } from "./services/admin-projects.service";
import { AdminTasksService } from "./services/admin-tasks.service";
import { AdminContractsService } from "./services/admin-contracts.service";
import { AdminLeadsService } from "./services/admin-leads.service";
import { AdminRequestsService } from "./services/admin-requests.service";
import { AdminCampaignsService } from "./services/admin-campaigns.service";
import { AdminChatService } from "./services/admin-chat.service";
import { AdminPortalService } from "./services/admin-portal.service";
import { AdminFinanceService } from "./services/admin-finance.service";
import { AdminProposalsService } from "./services/admin-proposals.service";
import { AdminClientsService } from "./services/admin-clients.service";
import { AdminIntegrationsService } from "./services/admin-integrations.service";
import { AdminAutomationService } from "./services/admin-automation.service";
import { AdminFeatureFlagsService } from "./services/admin-feature-flags.service";
import { AdminEnvironmentService } from "./services/admin-environment.service";
import { AdminBackupsService } from "./services/admin-backups.service";

import { PrismaHealthIndicator } from "../health/indicators";
import { HealthPersistenceService } from "../health/services/health-persistence.service";
import { RobustErrorLoggerService } from "../health/services/robust-error-logger.service";

@Module({
  imports: [
    PrismaModule,
    FinanceModule,
    TerminusModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") ?? "default_secret",
        signOptions: {
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") || "1h") as unknown as number,
        },
      }),
    }),
  ],
  controllers: [
    AdminController,
    AdminAuditController,
    AdminSettingsController,
    AdminUsersController,
    AdminSessionsController,
    AdminSecurityController,
    AdminProjectsController,
    AdminTasksController,
    AdminContractsController,
    AdminLeadsController,
    AdminRequestsController,
    AdminCampaignsController,
    AdminChatController,
    AdminPortalController,
    AdminFinanceController,
    AdminProposalsController,
    AdminClientsController,
    AdminIntegrationsController,
    AdminAutomationController,
    AdminFeatureFlagsController,
    AdminEnvironmentController,
    AdminBackupsController,
  ],
  providers: [
    AdminService,
    AdminAuditService,
    AdminSettingsService,
    AdminUsersService,
    AdminSessionsService,
    AdminSecurityService,
    AdminProjectsService,
    AdminTasksService,
    AdminContractsService,
    AdminLeadsService,
    AdminRequestsService,
    AdminCampaignsService,
    AdminChatService,
    AdminPortalService,
    AdminFinanceService,
    AdminProposalsService,
    AdminClientsService,
    AdminIntegrationsService,
    AdminAutomationService,
    AdminFeatureFlagsService,
    AdminEnvironmentService,
    AdminBackupsService,
    PrismaHealthIndicator,
    HealthPersistenceService,
    RobustErrorLoggerService,
  ],
  exports: [
    AdminAuditService,
    AdminSettingsService,
    AdminUsersService,
    AdminSessionsService,
    AdminSecurityService,
  ],
})
export class AdminModule {}
