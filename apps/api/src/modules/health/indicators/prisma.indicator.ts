import { Injectable, Logger } from "@nestjs/common";
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from "@nestjs/terminus";
import { PrismaService } from "../../../prisma/prisma.service";
import { HealthPersistenceService } from "../services/health-persistence.service";
import { RobustErrorLoggerService } from "../services/robust-error-logger.service";
import {
  ServiceStatus,
  ErrorCategory,
  ErrorLevel,
} from "../dto/health-check.dto";

@Injectable()
export class PrismaHealthIndicator {
  private readonly logger = new Logger(PrismaHealthIndicator.name);

  constructor(
    private healthIndicatorService: HealthIndicatorService,
    private prisma: PrismaService,
    private healthPersistence: HealthPersistenceService,
    private errorLogger: RobustErrorLoggerService,
  ) {}

  async pingCheck(
    key: string,
    options?: { timeout?: number },
  ): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startTime = Date.now();
    const timeout = options?.timeout || 3000;

    try {
      // Use Promise.race to implement timeout
      const result = await Promise.race([
        this.prisma.$queryRaw<[{ "1": number }]>`SELECT 1`,
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error(`Database query timeout after ${timeout}ms`)),
            timeout,
          ),
        ),
      ]);

      const responseTime = Date.now() - startTime;

      await this.healthPersistence.updateServiceHealth(
        "DATABASE",
        ServiceStatus.UP,
        responseTime,
      );

      return indicator.up({
        responseTimeMs: responseTime,
        query: "SELECT 1",
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown database error";

      await this.healthPersistence.updateServiceHealth(
        "DATABASE",
        ServiceStatus.DOWN,
        responseTime,
        errorMessage,
      );

      await this.errorLogger.logError({
        level: ErrorLevel.ERROR,
        category: ErrorCategory.DATABASE,
        message: `Database health check failed: ${errorMessage}`,
        error: error instanceof Error ? error : undefined,
        service: "PrismaHealthIndicator",
      });

      return indicator.down({
        message: errorMessage,
        responseTimeMs: responseTime,
      });
    }
  }
}
