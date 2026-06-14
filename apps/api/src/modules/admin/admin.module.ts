import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { TerminusModule } from "@nestjs/terminus";
import { AdminController } from "./controllers/admin.controller";
import { AdminAuditController } from "./controllers/admin-audit.controller";
import { AdminSettingsController } from "./controllers/admin-settings.controller";
import { AdminService } from "./services/admin.service";
import { AdminAuditService } from "./services/admin-audit.service";
import { AdminSettingsService } from "./services/admin-settings.service";
import { PrismaHealthIndicator } from "../health/indicators";
import { HealthPersistenceService } from "../health/services/health-persistence.service";
import { RobustErrorLoggerService } from "../health/services/robust-error-logger.service";

@Module({
  imports: [PrismaModule, TerminusModule],
  controllers: [AdminController, AdminAuditController, AdminSettingsController],
  providers: [
    AdminService,
    AdminAuditService,
    AdminSettingsService,
    PrismaHealthIndicator,
    HealthPersistenceService,
    RobustErrorLoggerService,
  ],
  exports: [AdminAuditService, AdminSettingsService],
})
export class AdminModule {}
