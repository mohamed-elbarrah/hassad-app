import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { TerminusModule } from "@nestjs/terminus";

import { AdminController } from "./controllers/admin.controller";
import { AdminAuditController } from "./controllers/admin-audit.controller";
import { AdminSettingsController } from "./controllers/admin-settings.controller";
import { AdminUsersController } from "./controllers/admin-users.controller";
import { AdminSessionsController } from "./controllers/admin-sessions.controller";
import { AdminSecurityController } from "./controllers/admin-security.controller";

import { AdminService } from "./services/admin.service";
import { AdminAuditService } from "./services/admin-audit.service";
import { AdminSettingsService } from "./services/admin-settings.service";
import { AdminUsersService } from "./services/admin-users.service";
import { AdminSessionsService } from "./services/admin-sessions.service";
import { AdminSecurityService } from "./services/admin-security.service";

import { PrismaHealthIndicator } from "../health/indicators";
import { HealthPersistenceService } from "../health/services/health-persistence.service";
import { RobustErrorLoggerService } from "../health/services/robust-error-logger.service";

@Module({
  imports: [
    PrismaModule,
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
  ],
  providers: [
    AdminService,
    AdminAuditService,
    AdminSettingsService,
    AdminUsersService,
    AdminSessionsService,
    AdminSecurityService,
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
