import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminService } from "../services/admin.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { HealthCheckService, MemoryHealthIndicator } from "@nestjs/terminus";
import { PrismaHealthIndicator } from "../../health/indicators";
import { HealthPersistenceService } from "../../health/services/health-persistence.service";
import { RobustErrorLoggerService } from "../../health/services/robust-error-logger.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly healthPersistence: HealthPersistenceService,
    private readonly errorLogger: RobustErrorLoggerService,
  ) {}

  @Get("stats")
  @RequirePermissions("admin.stats")
  getStats() {
    return this.adminService.getStats();
  }

  @Get("stats/trends")
  @RequirePermissions("admin.stats.trends")
  getTrends(@Query("days") days?: string) {
    return this.adminService.getTrends(days ? parseInt(days, 10) : 30);
  }

  @Get("funnel")
  @RequirePermissions("admin.funnel")
  getFunnel() {
    return this.adminService.getFunnel();
  }

  @Get("alerts")
  @RequirePermissions("admin.alerts")
  getAlerts() {
    return this.adminService.getAlerts();
  }

  @Get("health")
  @RequirePermissions("admin.stats")
  async getHealth() {
    // Use the new health check system
    const startTime = Date.now();
    
    const result = await this.health.check([
      () => this.prismaIndicator.pingCheck("database", { timeout: 3000 }),
      () => this.memoryIndicator.checkHeap("memory_heap", 512 * 1024 * 1024),
    ]);

    // Get additional error stats
    const errorStats = await this.errorLogger.getErrorStats(24);
    const unresolvedErrors = await this.errorLogger.getUnresolvedCount();
    const services = await this.healthPersistence.getServiceHealth();

    // Transform to maintain backward compatibility with old format
    return {
      status: result.status === "ok" ? "healthy" : "degraded",
      database: result.status === "ok" ? "connected" : "disconnected",
      recentErrors: errorStats.total,
      activeUsersLastHour: 0, // Not tracked in new system yet
      pendingWebhooks: 0, // From new system
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString(),
      // Additional new fields
      overallScore: this.calculateHealthScore(result),
      services: services.map(s => ({
        name: s.serviceName,
        status: s.status.toLowerCase(),
        responseTime: s.responseTime,
      })),
      unresolvedErrors,
    };
  }

  private calculateHealthScore(result: any): number {
    const allIndicators = { ...result.info, ...result.error };
    const totalIndicators = Object.keys(allIndicators).length;
    
    if (totalIndicators === 0) return 0;

    const healthyIndicators = Object.keys(result.info).length;
    return Math.round((healthyIndicators / totalIndicators) * 100);
  }
}
