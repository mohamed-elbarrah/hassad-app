import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HttpModule } from "@nestjs/axios";
import { HealthController } from "./controllers/health.controller";
import { RobustErrorLoggerService } from "./services/robust-error-logger.service";
import { HealthPersistenceService } from "./services/health-persistence.service";
import {
  R2StorageHealthIndicator,
  SmtpHealthIndicator,
  StripeHealthIndicator,
  PrismaHealthIndicator,
} from "./indicators";

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: "json",
      logger: false, // We'll handle logging ourselves
    }),
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [
    RobustErrorLoggerService,
    HealthPersistenceService,
    R2StorageHealthIndicator,
    SmtpHealthIndicator,
    StripeHealthIndicator,
    PrismaHealthIndicator,
  ],
  exports: [RobustErrorLoggerService, HealthPersistenceService],
})
export class HealthModule {}
