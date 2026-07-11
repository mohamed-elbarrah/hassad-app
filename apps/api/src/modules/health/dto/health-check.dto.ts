import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export enum HealthStatus {
  HEALTHY = "HEALTHY",
  DEGRADED = "DEGRADED",
  UNHEALTHY = "UNHEALTHY",
}

export enum ServiceStatus {
  UP = "UP",
  DEGRADED = "DEGRADED",
  DOWN = "DOWN",
}

export enum ErrorLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
}

export enum ErrorCategory {
  DATABASE = "DATABASE",
  EXTERNAL_API = "EXTERNAL_API",
  AUTH = "AUTH",
  STORAGE = "STORAGE",
  PAYMENT_GATEWAY = "PAYMENT_GATEWAY",
  EMAIL = "EMAIL",
  AI_SERVICE = "AI_SERVICE",
  GENERAL = "GENERAL",
  NETWORK = "NETWORK",
  MEMORY = "MEMORY",
}

export class HealthCheckResultDto {
  status: string;
  info: Record<string, HealthIndicatorResultDto>;
  error: Record<string, HealthIndicatorResultDto>;
  details: Record<string, HealthIndicatorResultDto>;
  timestamp: string;
  responseTimeMs: number;
}

export class HealthIndicatorResultDto {
  status: "up" | "down";
  message?: string;
  responseTimeMs?: number;
  [key: string]: any;
}

export class ErrorLogQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ErrorLevel, { each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") return value.split(",");
    return value;
  })
  level?: ErrorLevel[];

  @IsOptional()
  @IsArray()
  @IsEnum(ErrorCategory, { each: true })
  @Transform(({ value }) => {
    if (typeof value === "string") return value.split(",");
    return value;
  })
  category?: ErrorCategory[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hours?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  resolved?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;
}

export class ResolveErrorDto {
  @IsString()
  note: string;
}

export class HealthHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class SystemErrorDto {
  id: string;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  stackTrace?: string;
  context?: Record<string, any>;
  service: string;
  endpoint?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  resolvedBy?: string;
  createdAt: string;
}

export class ErrorStatsDto {
  byLevel: Array<{ level: string; _count: { level: number } }>;
  byCategory: Array<{ category: string; _count: { category: number } }>;
  total: number;
  period: string;
}

export class ServiceHealthDto {
  serviceName: string;
  displayName: string;
  status: ServiceStatus;
  responseTime: number;
  lastCheckedAt: string;
  lastError?: string;
  lastErrorAt?: string;
  consecutiveFailures: number;
  timeoutThreshold: number;
  degradationThreshold: number;
}

export class HealthHistoryDto {
  id: string;
  status: HealthStatus;
  overallScore: number;
  components: Record<string, any>;
  memoryUsed?: number;
  memoryTotal?: number;
  uptime: number;
  cpuUsage?: number;
  totalResponseTime: number;
  createdAt: string;
}
