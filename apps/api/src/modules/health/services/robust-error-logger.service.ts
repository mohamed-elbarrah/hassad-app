import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorLevel, ErrorCategory } from '../dto/health-check.dto';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
  metadata?: Record<string, any>;
}

export interface ErrorFilters {
  level?: ErrorLevel[];
  category?: ErrorCategory[];
  hours?: number;
  resolved?: boolean;
  limit?: number;
  page?: number;
  service?: string;
}

interface QueuedError {
  params: LogErrorParams;
  timestamp: string;
  retryCount: number;
}

@Injectable()
export class RobustErrorLoggerService implements OnModuleInit {
  private readonly logger = new Logger(RobustErrorLoggerService.name);
  private errorQueue: QueuedError[] = [];
  private isProcessingQueue = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 5000;
  private readonly LOG_FILE_PATH: string;
  private dbAvailable = true;
  private consecutiveDbFailures = 0;
  private readonly DB_FAILURE_THRESHOLD = 5;

  constructor(private prisma: PrismaService) {
    // Create logs directory in project root
    this.LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'errors.log');
    this.ensureLogDirectory();
  }

  onModuleInit() {
    // Start queue processor
    this.startQueueProcessor();
    
    // Setup process-level error handlers
    this.setupProcessErrorHandlers();
    
    this.logger.log('Robust error logger initialized');
    this.logger.log(`Fallback log file: ${this.LOG_FILE_PATH}`);
  }

  /**
   * Primary method to log errors - NEVER throws, NEVER loses data
   */
  async logError(params: LogErrorParams): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // ALWAYS log to console first (immediate visibility)
    this.logToConsole(params, timestamp);
    
    // Try to save to database
    try {
      await this.saveToDatabase(params);
      this.dbAvailable = true;
      this.consecutiveDbFailures = 0;
    } catch (dbError) {
      this.consecutiveDbFailures++;
      
      // If DB is failing consistently, mark as unavailable
      if (this.consecutiveDbFailures >= this.DB_FAILURE_THRESHOLD) {
        this.dbAvailable = false;
        this.logger.error(`Database marked unavailable after ${this.consecutiveDbFailures} consecutive failures`);
      }
      
      // CRITICAL: Save to file as fallback
      this.saveToFile(params, timestamp);
      
      // Queue for later retry
      this.queueError(params, timestamp);
      
      this.logger.warn(`Error queued for retry due to DB failure: ${params.message}`);
    }
  }

  /**
   * Log process-level errors (uncaught exceptions, unhandled rejections)
   */
  logProcessError(error: Error, type: 'uncaught' | 'unhandled' | 'warning'): void {
    const timestamp = new Date().toISOString();
    
    const params: LogErrorParams = {
      level: type === 'warning' ? ErrorLevel.WARN : ErrorLevel.ERROR,
      category: ErrorCategory.GENERAL,
      message: `[${type.toUpperCase()}] ${error.message}`,
      error,
      service: 'PROCESS',
      context: {
        type,
        stack: error.stack,
        timestamp,
      },
    };

    // Log immediately to console
    this.logToConsole(params, timestamp);
    
    // Try to save to file (sync for process errors)
    this.saveToFile(params, timestamp);
    
    // Try async DB save (non-blocking)
    this.saveToDatabase(params).catch(() => {
      this.queueError(params, timestamp);
    });
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

    if (filters.service) {
      where.service = filters.service;
    }

    const skip = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;
    const take = filters.limit || 50;

    try {
      const [items, total] = await Promise.all([
        this.prisma.systemError.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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
    } catch (error) {
      this.logger.error('Failed to fetch errors from database:', error);
      // Return empty result but don't throw
      return {
        items: [],
        total: 0,
        page: filters.page || 1,
        limit: take,
        totalPages: 0,
      };
    }
  }

  async getErrorStats(hours: number = 24): Promise<{
    byLevel: Array<{ level: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    byService: Array<{ service: string; count: number }>;
    total: number;
    unresolved: number;
    period: string;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const [byLevelRaw, byCategoryRaw, byServiceRaw, total, unresolved] = await Promise.all([
        this.prisma.systemError.groupBy({
          by: ['level'],
          where: { createdAt: { gte: since } },
          _count: { level: true },
        }),
        this.prisma.systemError.groupBy({
          by: ['category'],
          where: { createdAt: { gte: since } },
          _count: { category: true },
        }),
        this.prisma.systemError.groupBy({
          by: ['service'],
          where: { createdAt: { gte: since } },
          _count: { service: true },
        }),
        this.prisma.systemError.count({
          where: { createdAt: { gte: since } },
        }),
        this.prisma.systemError.count({
          where: { createdAt: { gte: since }, resolved: false },
        }),
      ]);

      return {
        byLevel: byLevelRaw.map((item) => ({ level: item.level, count: item._count.level })),
        byCategory: byCategoryRaw.map((item) => ({ category: item.category, count: item._count.category })),
        byService: byServiceRaw.map((item) => ({ service: item.service, count: item._count.service })),
        total,
        unresolved,
        period: `${hours}h`,
      };
    } catch (error) {
      this.logger.error('Failed to get error stats:', error);
      return {
        byLevel: [],
        byCategory: [],
        byService: [],
        total: 0,
        unresolved: 0,
        period: `${hours}h`,
      };
    }
  }

  async resolveError(errorId: string, userId: string, note: string): Promise<void> {
    try {
      await this.prisma.systemError.update({
        where: { id: errorId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolutionNote: note,
          resolvedBy: userId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to resolve error ${errorId}:`, error);
      throw error;
    }
  }

  async getUnresolvedCount(): Promise<number> {
    try {
      return this.prisma.systemError.count({
        where: { resolved: false },
      });
    } catch (error) {
      this.logger.error('Failed to get unresolved count:', error);
      return 0;
    }
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): { size: number; dbAvailable: boolean } {
    return {
      size: this.errorQueue.length,
      dbAvailable: this.dbAvailable,
    };
  }

  /**
   * Manually retry queued errors
   */
  async retryQueuedErrors(): Promise<number> {
    if (this.errorQueue.length === 0) return 0;
    
    const retryCount = this.errorQueue.length;
    this.logger.log(`Retrying ${retryCount} queued errors...`);
    
    await this.processQueue();
    return retryCount;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private logToConsole(params: LogErrorParams, timestamp: string): void {
    const logMessage = `[${timestamp}] [${params.level}] [${params.category}] ${params.service}: ${params.message}`;
    
    if (params.level === ErrorLevel.ERROR) {
      this.logger.error(logMessage);
      if (params.error?.stack) {
        this.logger.error(params.error.stack);
      }
    } else if (params.level === ErrorLevel.WARN) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  private async saveToDatabase(params: LogErrorParams): Promise<void> {
    await this.prisma.systemError.create({
      data: {
        level: params.level,
        category: params.category,
        message: params.message,
        stackTrace: params.error?.stack || null,
        context: params.context || params.metadata || {},
        service: params.service,
        endpoint: params.endpoint || null,
        resolved: false,
      },
    });
  }

  private saveToFile(params: LogErrorParams, timestamp: string): void {
    try {
      const logEntry = {
        timestamp,
        level: params.level,
        category: params.category,
        service: params.service,
        message: params.message,
        stack: params.error?.stack,
        context: params.context,
        endpoint: params.endpoint,
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Append to file (create if doesn't exist)
      fs.appendFileSync(this.LOG_FILE_PATH, logLine, { encoding: 'utf8' });
    } catch (fileError) {
      // Last resort - just console
      this.logger.error('CRITICAL: Failed to write to log file:', fileError);
    }
  }

  private queueError(params: LogErrorParams, timestamp: string): void {
    this.errorQueue.push({
      params,
      timestamp,
      retryCount: 0,
    });
  }

  private async startQueueProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.errorQueue.length > 0 && !this.isProcessingQueue) {
        await this.processQueue();
      }
    }, this.RETRY_DELAY_MS);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    const failedItems: QueuedError[] = [];
    
    for (const item of this.errorQueue) {
      try {
        await this.saveToDatabase(item.params);
        this.logger.log(`Successfully replayed queued error: ${item.params.message}`);
      } catch (error) {
        item.retryCount++;
        
        if (item.retryCount < this.MAX_RETRIES) {
          failedItems.push(item);
        } else {
          // Max retries reached - ensure it's in file
          this.saveToFile(item.params, item.timestamp);
          this.logger.error(`Dropped error after ${this.MAX_RETRIES} retries: ${item.params.message}`);
        }
      }
    }
    
    this.errorQueue = failedItems;
    this.isProcessingQueue = false;
    
    if (failedItems.length > 0) {
      this.logger.warn(`${failedItems.length} errors still queued for retry`);
    }
  }

  private ensureLogDirectory(): void {
    try {
      const dir = path.dirname(this.LOG_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to create logs directory:', error);
    }
  }

  private setupProcessErrorHandlers(): void {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logProcessError(error, 'uncaught');
      // Give time for logging before exit
      setTimeout(() => process.exit(1), 1000);
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.logProcessError(error, 'unhandled');
    });

    // Warnings
    process.on('warning', (warning) => {
      this.logProcessError(warning, 'warning');
    });

    // SIGTERM handler for graceful shutdown
    process.on('SIGTERM', () => {
      this.logger.log('SIGTERM received, flushing error queue...');
      this.processQueue().then(() => process.exit(0));
    });

    this.logger.log('Process error handlers registered');
  }
}
