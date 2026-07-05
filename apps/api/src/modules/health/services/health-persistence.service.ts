import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { HealthCheckResult, HealthIndicatorResult } from "@nestjs/terminus";
import { HealthStatus, ServiceStatus } from "../dto/health-check.dto";

@Injectable()
export class HealthPersistenceService {
  constructor(private prisma: PrismaService) {}

  async saveHealthCheck(
    result: HealthCheckResult,
    totalResponseTime: number,
  ): Promise<void> {
    try {
      const status = this.determineOverallStatus(result);
      const score = this.calculateHealthScore(result);
      const components = this.extractComponents(result);

      await this.prisma.systemHealthCheck.create({
        data: {
          status,
          overallScore: score,
          components,
          memoryUsed: process.memoryUsage().heapUsed,
          memoryTotal: process.memoryUsage().heapTotal,
          uptime: process.uptime(),
          totalResponseTime,
        },
      });
    } catch (error) {
      // Don't throw - health check persistence should not break health checks
      console.error("Failed to save health check:", error);
    }
  }

  async updateServiceHealth(
    serviceName: string,
    status: ServiceStatus,
    responseTime: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const existing = await this.prisma.externalServiceHealth.findUnique({
        where: { serviceName },
      });

      const consecutiveFailures =
        status === ServiceStatus.DOWN
          ? (existing?.consecutiveFailures || 0) + 1
          : 0;

      await this.prisma.externalServiceHealth.upsert({
        where: { serviceName },
        create: {
          serviceName,
          status,
          responseTime,
          lastCheckedAt: new Date(),
          lastError: errorMessage || null,
          lastErrorAt: errorMessage ? new Date() : null,
          consecutiveFailures,
        },
        update: {
          status,
          responseTime,
          lastCheckedAt: new Date(),
          lastError: errorMessage || null,
          lastErrorAt: errorMessage ? new Date() : existing?.lastErrorAt,
          consecutiveFailures,
        },
      });
    } catch (error) {
      console.error(
        `Failed to update service health for ${serviceName}:`,
        error,
      );
    }
  }

  async getHealthHistory(hours: number = 24, limit: number = 100) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.systemHealthCheck.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getServiceHealth() {
    return this.prisma.externalServiceHealth.findMany({
      orderBy: { serviceName: "asc" },
    });
  }

  async getServiceStatus(serviceName: string) {
    return this.prisma.externalServiceHealth.findUnique({
      where: { serviceName },
    });
  }

  private determineOverallStatus(result: HealthCheckResult): HealthStatus {
    const hasErrors = Object.keys(result.error).length > 0;
    const allHealthy = Object.keys(result.info).length > 0 && !hasErrors;

    if (hasErrors) {
      // Check if it's just degraded or fully unhealthy
      const errorKeys = Object.keys(result.error);
      const criticalServices = ["database"];
      const hasCriticalFailure = errorKeys.some((key) =>
        criticalServices.some((critical) =>
          key.toLowerCase().includes(critical),
        ),
      );

      return hasCriticalFailure
        ? HealthStatus.UNHEALTHY
        : HealthStatus.DEGRADED;
    }

    return allHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;
  }

  private calculateHealthScore(result: HealthCheckResult): number {
    const allIndicators = { ...result.info, ...result.error };
    const totalIndicators = Object.keys(allIndicators).length;

    if (totalIndicators === 0) return 0;

    const healthyIndicators = Object.keys(result.info).length;
    return Math.round((healthyIndicators / totalIndicators) * 100);
  }

  private extractComponents(result: HealthCheckResult): Record<string, any> {
    const components: Record<string, any> = {};

    for (const [key, value] of Object.entries(result.info)) {
      components[key] = { status: "up", ...value };
    }

    for (const [key, value] of Object.entries(result.error)) {
      components[key] = { status: "down", ...value };
    }

    return components;
  }
}
