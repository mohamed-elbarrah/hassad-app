import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ErrorLevel, ErrorCategory } from "../dto/health-check.dto";
import { Prisma } from "@prisma/client";

export interface LogErrorParams {
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  service: string;
  endpoint?: string;
  userId?: string;
  requestId?: string;
}

export interface ErrorFilters {
  level?: ErrorLevel[];
  category?: ErrorCategory[];
  hours?: number;
  resolved?: boolean;
  limit?: number;
  page?: number;
}

@Injectable()
export class ErrorLoggerService {
  private readonly logger = new Logger(ErrorLoggerService.name);

  constructor(private prisma: PrismaService) {}

  async logError(params: LogErrorParams): Promise<void> {
    try {
      await this.prisma.systemError.create({
        data: {
          level: params.level,
          category: params.category,
          message: params.message,
          stackTrace: params.error?.stack || null,
          context: params.context || {},
          service: params.service,
          endpoint: params.endpoint || null,
          resolved: false,
        },
      });

      // Also log to console for immediate visibility
      const serviceLogger = new Logger(params.service);
      const logMessage = `[${params.category}] ${params.message}`;

      if (params.level === ErrorLevel.ERROR) {
        serviceLogger.error(logMessage, params.error?.stack);
      } else if (params.level === ErrorLevel.WARN) {
        serviceLogger.warn(logMessage);
      } else {
        serviceLogger.log(logMessage);
      }
    } catch (dbError) {
      // If we can't log to DB, at least log to console
      this.logger.error("Failed to persist error to database:", dbError);
      this.logger.error(
        `Original error [${params.level}] ${params.category}: ${params.message}`,
        params.error?.stack,
      );
    }
  }

  async getRecentErrors(filters: ErrorFilters) {
    const where: Prisma.SystemErrorWhereInput = {};

    if (filters.hours) {
      where.createdAt = {
        gte: new Date(Date.now() - filters.hours * 60 * 60 * 1000),
      };
    }

    if (filters.level?.length) {
      where.level = { in: filters.level };
    }

    if (filters.category?.length) {
      where.category = { in: filters.category };
    }

    if (filters.resolved !== undefined) {
      where.resolved = filters.resolved;
    }

    const skip =
      filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;
    const take = filters.limit || 50;

    const [items, total] = await Promise.all([
      this.prisma.systemError.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.systemError.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async getErrorStats(hours: number = 24): Promise<{
    byLevel: Array<{ level: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    total: number;
    period: string;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [byLevelRaw, byCategoryRaw, total] = await Promise.all([
      this.prisma.systemError.groupBy({
        by: ["level"],
        where: { createdAt: { gte: since } },
        _count: { level: true },
      }),
      this.prisma.systemError.groupBy({
        by: ["category"],
        where: { createdAt: { gte: since } },
        _count: { category: true },
      }),
      this.prisma.systemError.count({
        where: { createdAt: { gte: since } },
      }),
    ]);

    return {
      byLevel: byLevelRaw.map((item) => ({
        level: item.level,
        count: item._count.level,
      })),
      byCategory: byCategoryRaw.map((item) => ({
        category: item.category,
        count: item._count.category,
      })),
      total,
      period: `${hours}h`,
    };
  }

  async resolveError(
    errorId: string,
    userId: string,
    note: string,
  ): Promise<void> {
    await this.prisma.systemError.update({
      where: { id: errorId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolutionNote: note,
        resolvedBy: userId,
      },
    });
  }

  async getUnresolvedCount(): Promise<number> {
    return this.prisma.systemError.count({
      where: { resolved: false },
    });
  }

  async getRecentErrorsByCategory(category: ErrorCategory, hours: number = 24) {
    return this.prisma.systemError.findMany({
      where: {
        category,
        createdAt: { gte: new Date(Date.now() - hours * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }
}
