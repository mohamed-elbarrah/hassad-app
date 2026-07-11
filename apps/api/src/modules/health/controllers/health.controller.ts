import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheck,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  PrismaHealthIndicator,
  R2StorageHealthIndicator,
  SmtpHealthIndicator,
  StripeHealthIndicator,
} from "../indicators";
import { RobustErrorLoggerService } from "../services/robust-error-logger.service";
import { HealthPersistenceService } from "../services/health-persistence.service";
import {
  ErrorLogQueryDto,
  ResolveErrorDto,
  HealthHistoryQueryDto,
  ServiceStatus,
} from "../dto/health-check.dto";

@Controller("health")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private r2Indicator: R2StorageHealthIndicator,
    private smtpIndicator: SmtpHealthIndicator,
    private stripeIndicator: StripeHealthIndicator,
    private memoryIndicator: MemoryHealthIndicator,
    private diskIndicator: DiskHealthIndicator,
    private errorLogger: RobustErrorLoggerService,
    private healthPersistence: HealthPersistenceService,
  ) {}

  // Public endpoint for load balancers - no auth required
  @Public()
  @Get("live")
  liveness() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  // Readiness check - includes critical dependencies
  @Get("ready")
  @HealthCheck()
  async readiness() {
    const startTime = Date.now();

    const result = await this.health.check([
      () => this.prismaIndicator.pingCheck("database", { timeout: 3000 }),
      () => this.memoryIndicator.checkHeap("memory_heap", 512 * 1024 * 1024), // 512MB
    ]);

    return {
      ...result,
      responseTimeMs: Date.now() - startTime,
    };
  }

  // Detailed health check for admin dashboard
  @Get()
  @RequirePermissions("admin.stats")
  @HealthCheck()
  async check() {
    const startTime = Date.now();

    // Run critical checks first
    const criticalChecks = [
      () => this.prismaIndicator.pingCheck("database", { timeout: 3000 }),
      () => this.memoryIndicator.checkHeap("memory_heap", 512 * 1024 * 1024),
      () =>
        this.diskIndicator.checkStorage("disk", {
          path: "/",
          thresholdPercent: 0.9,
        }),
    ];

    const result = await this.health.check(criticalChecks);

    // Run external service checks separately - these shouldn't fail the whole check
    const externalResults = await Promise.allSettled([
      this.r2Indicator.isHealthy("r2_storage"),
      this.smtpIndicator.isHealthy("smtp"),
      this.stripeIndicator.isHealthy("stripe"),
    ]);

    // Merge external results
    const serviceKeys = ["r2_storage", "smtp", "stripe"];
    externalResults.forEach((res, index) => {
      const key = serviceKeys[index];
      if (res.status === "fulfilled") {
        if (res.value[key]?.status === "up") {
          result.info[key] = res.value[key];
        } else {
          result.error[key] = res.value[key];
        }
        result.details[key] = res.value[key];
      } else {
        const errorDetail = {
          status: "down" as const,
          message: res.reason?.message || `${key} check failed`,
        };
        result.error[key] = errorDetail;
        result.details[key] = errorDetail;
      }
    });

    // Recalculate status based on all checks
    if (Object.keys(result.error).length > 0) {
      result.status = "error";
    }

    // Save to history
    await this.healthPersistence.saveHealthCheck(
      result,
      Date.now() - startTime,
    );

    return {
      ...result,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
    };
  }

  @Get("errors")
  @RequirePermissions("admin.stats")
  async getErrors(@Query() filters: ErrorLogQueryDto) {
    return this.errorLogger.getRecentErrors(filters);
  }

  @Get("errors/stats")
  @RequirePermissions("admin.stats")
  async getErrorStats(@Query("hours") hours?: string) {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.errorLogger.getErrorStats(hoursNum);
  }

  @Get("errors/unresolved-count")
  @RequirePermissions("admin.stats")
  async getUnresolvedErrorCount() {
    const count = await this.errorLogger.getUnresolvedCount();
    return { count };
  }

  @Post("errors/:id/resolve")
  @RequirePermissions("admin.stats")
  async resolveError(
    @Param("id") errorId: string,
    @Body() dto: ResolveErrorDto,
    @CurrentUser("userId") userId: string,
  ) {
    await this.errorLogger.resolveError(errorId, userId, dto.note);
    return { success: true, message: "Error marked as resolved" };
  }

  @Get("history")
  @RequirePermissions("admin.stats")
  async getHistory(@Query() query: HealthHistoryQueryDto) {
    return this.healthPersistence.getHealthHistory(
      query.hours || 24,
      query.limit || 100,
    );
  }

  @Get("services")
  @RequirePermissions("admin.stats")
  async getServiceHealth() {
    const services = await this.healthPersistence.getServiceHealth();

    // Map to DTO with display names
    const displayNames: Record<string, string> = {
      R2_STORAGE: "R2 Storage (Cloudflare)",
      SMTP: "Email Service (SMTP)",
      STRIPE: "Payment Gateway (Stripe)",
      DATABASE: "Database (PostgreSQL)",
    };

    return services.map((service) => ({
      ...service,
      displayName: displayNames[service.serviceName] || service.serviceName,
    }));
  }

  @Get("summary")
  @RequirePermissions("admin.stats")
  async getHealthSummary() {
    const [currentHealth, errorStats, unresolvedErrors, services] =
      await Promise.all([
        this.health.check([
          () => this.prismaIndicator.pingCheck("database", { timeout: 3000 }),
          () =>
            this.memoryIndicator.checkHeap("memory_heap", 512 * 1024 * 1024),
        ]),
        this.errorLogger.getErrorStats(24),
        this.errorLogger.getUnresolvedCount(),
        this.healthPersistence.getServiceHealth(),
      ]);

    const degradedServices = services.filter(
      (s) =>
        s.status === ServiceStatus.DEGRADED || s.status === ServiceStatus.DOWN,
    );

    return {
      status: currentHealth.status,
      timestamp: new Date().toISOString(),
      errors: {
        total24h: errorStats.total,
        unresolved: unresolvedErrors,
        byCategory: errorStats.byCategory,
      },
      services: {
        total: services.length,
        degraded: degradedServices.length,
        down: services.filter((s) => s.status === ServiceStatus.DOWN).length,
        list: services,
      },
    };
  }
}
