import { Injectable, Logger } from "@nestjs/common";
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from "@nestjs/terminus";
import { StorageService } from "../../../common/storage/storage.service";
import { classifyR2ConnectionError } from "../../../common/storage/r2-config.provider";
import { HealthPersistenceService } from "../services/health-persistence.service";
import { RobustErrorLoggerService } from "../services/robust-error-logger.service";
import {
  ServiceStatus,
  ErrorCategory,
  ErrorLevel,
} from "../dto/health-check.dto";

@Injectable()
export class R2StorageHealthIndicator {
  private readonly logger = new Logger(R2StorageHealthIndicator.name);

  constructor(
    private healthIndicatorService: HealthIndicatorService,
    private storageService: StorageService,
    private healthPersistence: HealthPersistenceService,
    private errorLogger: RobustErrorLoggerService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startTime = Date.now();

    try {
      // Check if R2 is configured
      if (!this.storageService.isConfigured()) {
        const responseTime = Date.now() - startTime;
        const code = this.storageService.getConfigurationCode();
        await this.healthPersistence.updateServiceHealth(
          "R2_STORAGE",
          ServiceStatus.DOWN,
          responseTime,
          code,
        );

        return indicator.down({
          code,
          configured: false,
          responseTimeMs: responseTime,
        });
      }

      // Verify the active credentials and bucket with a real R2 request.
      await this.storageService.checkConnection();

      const responseTime = Date.now() - startTime;

      // Determine status based on response time
      const status =
        responseTime > 2000 ? ServiceStatus.DEGRADED : ServiceStatus.UP;

      await this.healthPersistence.updateServiceHealth(
        "R2_STORAGE",
        status,
        responseTime,
      );

      if (status === ServiceStatus.DEGRADED) {
        return indicator.down({
          code: "R2_CONNECTION_SLOW",
          details: { responseTimeMs: responseTime },
          configured: true,
          responseTimeMs: responseTime,
        });
      }

      return indicator.up({
        configured: true,
        responseTimeMs: responseTime,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const code =
        error instanceof Error && error.message.startsWith("R2_CONFIGURATION_")
          ? error.message
          : classifyR2ConnectionError(error);

      await this.healthPersistence.updateServiceHealth(
        "R2_STORAGE",
        ServiceStatus.DOWN,
        responseTime,
        code,
      );

      await this.errorLogger.logError({
        level: ErrorLevel.ERROR,
        category: ErrorCategory.STORAGE,
        message: code,
        error: error instanceof Error ? error : undefined,
        service: "R2StorageHealthIndicator",
      });

      return indicator.down({
        code,
        configured: true,
        responseTimeMs: responseTime,
      });
    }
  }
}
