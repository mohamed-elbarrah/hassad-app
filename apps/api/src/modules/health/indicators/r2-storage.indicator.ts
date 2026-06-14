import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { StorageService } from '../../../common/storage/storage.service';
import { HealthPersistenceService } from '../services/health-persistence.service';
import { RobustErrorLoggerService } from '../services/robust-error-logger.service';
import { ServiceStatus, ErrorCategory, ErrorLevel } from '../dto/health-check.dto';

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
        await this.healthPersistence.updateServiceHealth(
          'R2_STORAGE',
          ServiceStatus.DOWN,
          responseTime,
          'R2 not configured - check CLOUDFLARE_R2_* environment variables',
        );

        return indicator.down({
          message: 'R2 not configured - check CLOUDFLARE_R2_* environment variables',
          configured: false,
          responseTimeMs: responseTime,
        });
      }

      // Try to get a presigned URL for a test key (lightweight check)
      await this.storageService.getPresignedUrl('health-check-test', 1);
      
      const responseTime = Date.now() - startTime;
      
      // Determine status based on response time
      const status = responseTime > 2000 ? ServiceStatus.DEGRADED : ServiceStatus.UP;
      
      await this.healthPersistence.updateServiceHealth(
        'R2_STORAGE',
        status,
        responseTime,
      );

      if (status === ServiceStatus.DEGRADED) {
        return indicator.down({
          message: `R2 response time slow (${responseTime}ms)`,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.healthPersistence.updateServiceHealth(
        'R2_STORAGE',
        ServiceStatus.DOWN,
        responseTime,
        errorMessage,
      );

      await this.errorLogger.logError({
        level: ErrorLevel.ERROR,
        category: ErrorCategory.STORAGE,
        message: `R2 Storage health check failed: ${errorMessage}`,
        error: error instanceof Error ? error : undefined,
        service: 'R2StorageHealthIndicator',
      });

      return indicator.down({
        message: errorMessage,
        configured: true,
        responseTimeMs: responseTime,
      });
    }
  }
}
