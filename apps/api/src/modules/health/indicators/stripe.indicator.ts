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
export class StripeHealthIndicator {
  private readonly logger = new Logger(StripeHealthIndicator.name);

  constructor(
    private healthIndicatorService: HealthIndicatorService,
    private prisma: PrismaService,
    private healthPersistence: HealthPersistenceService,
    private errorLogger: RobustErrorLoggerService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startTime = Date.now();

    try {
      // Check if Stripe gateway is configured
      const gateway = await this.prisma.paymentGateway.findUnique({
        where: { name: "stripe" },
      });

      if (!gateway || !gateway.isActive) {
        const responseTime = Date.now() - startTime;
        await this.healthPersistence.updateServiceHealth(
          "STRIPE",
          ServiceStatus.DOWN,
          responseTime,
          gateway
            ? "Stripe gateway is disabled"
            : "Stripe gateway not configured",
        );

        return indicator.down({
          message: gateway
            ? "Stripe gateway is disabled"
            : "Stripe gateway not configured",
          configured: !!gateway,
          active: gateway?.isActive || false,
          responseTimeMs: responseTime,
        });
      }

      // Check if config exists and is valid
      let config: any = gateway.configJson;
      if (typeof config === "string") {
        try {
          config = JSON.parse(config);
        } catch {
          const responseTime = Date.now() - startTime;
          await this.healthPersistence.updateServiceHealth(
            "STRIPE",
            ServiceStatus.DOWN,
            responseTime,
            "Invalid Stripe configuration format",
          );

          return indicator.down({
            message: "Invalid Stripe configuration format",
            configured: true,
            active: true,
            responseTimeMs: responseTime,
          });
        }
      }

      if (!config?.secretKey) {
        const responseTime = Date.now() - startTime;
        await this.healthPersistence.updateServiceHealth(
          "STRIPE",
          ServiceStatus.DOWN,
          responseTime,
          "Stripe secret key not configured",
        );

        return indicator.down({
          message: "Stripe secret key not configured",
          configured: true,
          active: true,
          responseTimeMs: responseTime,
        });
      }

      // Get pending webhooks count as additional context
      const pendingWebhooks = await this.prisma.webhookLog.count({
        where: { processed: false },
      });

      const responseTime = Date.now() - startTime;

      await this.healthPersistence.updateServiceHealth(
        "STRIPE",
        ServiceStatus.UP,
        responseTime,
      );

      return indicator.up({
        configured: true,
        active: true,
        responseTimeMs: responseTime,
        pendingWebhooks,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await this.healthPersistence.updateServiceHealth(
        "STRIPE",
        ServiceStatus.DOWN,
        responseTime,
        errorMessage,
      );

      await this.errorLogger.logError({
        level: ErrorLevel.ERROR,
        category: ErrorCategory.PAYMENT_GATEWAY,
        message: `Stripe health check failed: ${errorMessage}`,
        error: error instanceof Error ? error : undefined,
        service: "StripeHealthIndicator",
      });

      return indicator.down({
        message: errorMessage,
        configured: false,
        responseTimeMs: responseTime,
      });
    }
  }
}
