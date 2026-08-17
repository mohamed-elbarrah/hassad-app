import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

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

export interface HealthIndicatorResult {
  status: "up" | "down";
  message?: string;
  responseTimeMs?: number;
  [key: string]: any;
}

export interface HealthCheckResult {
  status: "ok" | "error" | "shutting_down";
  info: Record<string, HealthIndicatorResult>;
  error: Record<string, HealthIndicatorResult>;
  details: Record<string, HealthIndicatorResult>;
  timestamp: string;
  responseTimeMs: number;
}

export interface SystemError {
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

export interface PaginatedSystemErrors {
  items: SystemError[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorStats {
  byLevel: Array<{ level: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  total: number;
  period: string;
}

export interface ServiceHealth {
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

export interface HealthHistory {
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

export interface HealthSummary {
  status: string;
  timestamp: string;
  errors: {
    total24h: number;
    unresolved: number;
    byCategory: Array<{ category: string; count: number }>;
  };
  services: {
    total: number;
    degraded: number;
    down: number;
    list: ServiceHealth[];
  };
}

export interface ErrorFilters {
  level?: ErrorLevel[];
  category?: ErrorCategory[];
  hours?: number;
  resolved?: boolean;
  limit?: number;
  page?: number;
}

export const healthApi = createApi({
  reducerPath: "healthApi",
  baseQuery,
  tagTypes: ["Health", "Errors", "Services", "HealthHistory"],
  endpoints: (builder) => ({
    // Health checks
    getHealth: builder.query<HealthCheckResult, void>({
      query: () => "/health",
      providesTags: ["Health"],
    }),

    getLiveness: builder.query<
      { status: string; timestamp: string; uptime: number },
      void
    >({
      query: () => "/health/live",
    }),

    getReadiness: builder.query<HealthCheckResult, void>({
      query: () => "/health/ready",
    }),

    getHealthSummary: builder.query<HealthSummary, void>({
      query: () => "/health/summary",
      providesTags: ["Health", "Errors", "Services"],
    }),

    // Error logs
    getErrors: builder.query<PaginatedSystemErrors, ErrorFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.level?.length) params.set("level", filters.level.join(","));
        if (filters.category?.length)
          params.set("category", filters.category.join(","));
        if (filters.hours) params.set("hours", String(filters.hours));
        if (filters.resolved !== undefined)
          params.set("resolved", String(filters.resolved));
        if (filters.limit) params.set("limit", String(filters.limit));
        if (filters.page) params.set("page", String(filters.page));
        return `/health/errors?${params.toString()}`;
      },
      providesTags: ["Errors"],
    }),

    getErrorStats: builder.query<ErrorStats, number | void>({
      query: (hours = 24) => `/health/errors/stats?hours=${hours}`,
      providesTags: ["Errors"],
    }),

    getUnresolvedErrorCount: builder.query<{ count: number }, void>({
      query: () => "/health/errors/unresolved-count",
      providesTags: ["Errors"],
    }),

    resolveError: builder.mutation<void, { id: string; note: string }>({
      query: ({ id, note }) => ({
        url: `/health/errors/${id}/resolve`,
        method: "POST",
        body: { note },
      }),
      invalidatesTags: ["Errors"],
    }),

    // Services
    getServiceHealth: builder.query<ServiceHealth[], void>({
      query: () => "/health/services",
      providesTags: ["Services"],
    }),

    // Health history
    getHealthHistory: builder.query<
      HealthHistory[],
      { hours?: number; limit?: number }
    >({
      query: ({ hours, limit }) => {
        const params = new URLSearchParams();
        if (hours) params.set("hours", String(hours));
        if (limit) params.set("limit", String(limit));
        return `/health/history?${params.toString()}`;
      },
      providesTags: ["HealthHistory"],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetLivenessQuery,
  useGetReadinessQuery,
  useGetHealthSummaryQuery,
  useGetErrorsQuery,
  useGetErrorStatsQuery,
  useGetUnresolvedErrorCountQuery,
  useResolveErrorMutation,
  useGetServiceHealthQuery,
  useGetHealthHistoryQuery,
} = healthApi;
