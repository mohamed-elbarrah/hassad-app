"use client";

import { useState } from "react";
import {
  useGetHealthQuery,
  useGetHealthSummaryQuery,
  useGetServiceHealthQuery,
  useGetErrorStatsQuery,
  useGetErrorsQuery,
  useResolveErrorMutation,
  type HealthCheckResult,
  type ServiceHealth,
  type SystemError,
  type HealthIndicatorResult,
  ErrorLevel,
  ErrorCategory,
  ServiceStatus,
} from "@/features/health/healthApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Activity,
  RefreshCw,
  Database,
  HardDrive,
  Mail,
  CreditCard,
  Server,
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Info,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} يوم ${h} ساعة ${m} دقيقة`;
  if (h > 0) return `${h} ساعة ${m} دقيقة`;
  return `${m} دقيقة`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ok":
    case "up":
    case "UP":
      return "success";
    case "degraded":
    case "DEGRADED":
    case "warning":
      return "warning";
    case "error":
    case "down":
    case "DOWN":
      return "danger";
    default:
      return "neutral";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "ok":
    case "up":
    case "UP":
      return CheckCircle;
    case "degraded":
    case "warning":
      return AlertTriangle;
    case "error":
    case "down":
    case "DOWN":
      return XCircle;
    default:
      return Info;
  }
}

function getComponentIcon(componentName: string) {
  switch (componentName.toLowerCase()) {
    case "database":
      return Database;
    case "memory_heap":
    case "memory_rss":
      return Cpu;
    case "disk":
      return HardDrive;
    case "r2_storage":
      return HardDrive;
    case "smtp":
      return Mail;
    case "stripe":
      return CreditCard;
    default:
      return Server;
  }
}

function getComponentDisplayName(componentName: string): string {
  const names: Record<string, string> = {
    database: "قاعدة البيانات",
    memory_heap: "الذاكرة (Heap)",
    memory_rss: "الذاكرة (RSS)",
    disk: "مساحة التخزين",
    r2_storage: "R2 Storage",
    smtp: "خدمة البريد",
    stripe: "Stripe Payments",
  };
  return names[componentName] || componentName;
}

function getErrorLevelIcon(level: ErrorLevel) {
  switch (level) {
    case ErrorLevel.ERROR:
      return XCircle;
    case ErrorLevel.WARN:
      return AlertTriangle;
    case ErrorLevel.INFO:
      return Info;
    default:
      return AlertCircle;
  }
}

function getErrorLevelColor(level: ErrorLevel): string {
  switch (level) {
    case ErrorLevel.ERROR:
      return "text-red-600 bg-red-50";
    case ErrorLevel.WARN:
      return "text-amber-600 bg-amber-50";
    case ErrorLevel.INFO:
      return "text-blue-600 bg-blue-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

// ============================================================================
// COMPONENT: OverallHealthCard
// ============================================================================

function OverallHealthCard({
  health,
  isLoading,
}: {
  health?: HealthCheckResult;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const isHealthy = health?.status === "ok";
  const healthyCount = Object.keys(health?.info || {}).length;
  const errorCount = Object.keys(health?.error || {}).length;
  const totalCount = healthyCount + errorCount;
  const score =
    totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 100;

  return (
    <div
      className={`rounded-2xl p-6 shadow-sm border-2 ${
        isHealthy
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`p-4 rounded-full ${
              isHealthy ? "bg-emerald-100" : "bg-amber-100"
            }`}
          >
            {isHealthy ? (
              <CheckCircle className="size-10 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-10 text-amber-600" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isHealthy ? "النظام يعمل بشكل طبيعي" : "هناك مشاكل في النظام"}
            </h2>
            <p className="text-slate-600 mt-1">
              {isHealthy
                ? "جميع الخدمات تعمل بشكل صحيح"
                : `${errorCount} خدمة تواجه مشاكل من ${totalCount}`}
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="text-5xl font-bold text-slate-900">{score}%</div>
          <div className="text-sm text-slate-500 mt-1">نسبة الصحة</div>
        </div>
      </div>

      {/* Show failing services */}
      {!isHealthy && errorCount > 0 && (
        <div className="mt-4 p-4 bg-white/60 rounded-xl">
          <h4 className="font-semibold text-red-700 mb-2">الخدمات المتوقفة:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(health?.error || {}).map(([name, detail]) => (
              <div
                key={name}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm"
              >
                <XCircle className="size-4" />
                <span>{getComponentDisplayName(name)}</span>
                {detail.message && (
                  <span className="text-red-600/80">- {detail.message}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {health?.timestamp && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-sm text-slate-500">
          <Clock className="size-4" />
          آخر فحص:{" "}
          {formatDistanceToNow(new Date(health.timestamp), { locale: ar })}
          {health.responseTimeMs && (
            <span className="mr-2">
              • وقت الاستجابة: {health.responseTimeMs}ms
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: ComponentHealthCard
// ============================================================================

function ComponentHealthCard({
  name,
  detail,
}: {
  name: string;
  detail: HealthIndicatorResult;
}) {
  const Icon = getComponentIcon(name);
  const isUp = detail.status === "up";
  const StatusIcon = getStatusIcon(detail.status);
  const statusColor = getStatusColor(detail.status);

  return (
    <div
      className={`rounded-xl p-4 shadow-sm border-2 transition-all hover:shadow-md ${
        isUp ? "bg-white border-emerald-200" : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${isUp ? "bg-emerald-100" : "bg-red-100"}`}
          >
            <Icon
              className={`size-5 ${isUp ? "text-emerald-600" : "text-red-600"}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {getComponentDisplayName(name)}
            </h3>
          </div>
        </div>

        <div
          className={`p-2 rounded-full ${
            isUp ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          <StatusIcon
            className={`size-5 ${isUp ? "text-emerald-600" : "text-red-600"}`}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">الحالة:</span>
          <span
            className={`font-medium ${isUp ? "text-emerald-600" : "text-red-600"}`}
          >
            {isUp ? "يعمل" : "متوقف"}
          </span>
        </div>

        {detail.responseTimeMs !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">وقت الاستجابة:</span>
            <span className="font-medium text-slate-900">
              {detail.responseTimeMs}ms
            </span>
          </div>
        )}

        {detail.message && (
          <div
            className={`mt-2 p-2 rounded text-sm ${
              isUp ? "bg-slate-50 text-slate-600" : "bg-red-100 text-red-700"
            }`}
          >
            {detail.message}
          </div>
        )}

        {/* Additional details */}
        {Object.entries(detail)
          .filter(([k]) => !["status", "message", "responseTimeMs"].includes(k))
          .map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-slate-500">{key}:</span>
              <span className="font-medium text-slate-900">
                {typeof value === "boolean"
                  ? value
                    ? "نعم"
                    : "لا"
                  : String(value)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: ErrorLogTable
// ============================================================================

function ErrorLogTable({
  errors,
  isLoading,
  onResolve,
}: {
  errors?: { items: SystemError[]; total: number };
  isLoading: boolean;
  onResolve: (id: string, note: string) => void;
}) {
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!errors?.items?.length) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
        <CheckCircle className="size-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900">
          لا توجد أخطاء مسجلة
        </h3>
        <p className="text-slate-500 mt-2">النظام يعمل بشكل طبيعي بدون أخطاء</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedErrors(newExpanded);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">
          سجل الأخطاء ({errors.total})
        </h3>
      </div>

      <div className="divide-y divide-slate-200 max-h-96 overflow-auto">
        {errors.items.slice(0, 20).map((error) => {
          const LevelIcon = getErrorLevelIcon(error.level);
          const levelColor = getErrorLevelColor(error.level);
          const isExpanded = expandedErrors.has(error.id);

          return (
            <div
              key={error.id}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${levelColor}`}>
                  <LevelIcon className="size-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${levelColor}`}
                    >
                      {error.level}
                    </span>
                    <span className="text-xs text-slate-500">
                      {error.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(error.createdAt), {
                        locale: ar,
                      })}
                    </span>
                    {error.resolved && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        تم الحل
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-700 font-medium">
                    {error.message}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    الخدمة: {error.service}
                    {error.endpoint && ` • ${error.endpoint}`}
                  </p>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-slate-100 rounded-lg text-sm">
                      {error.stackTrace && (
                        <div className="mb-2">
                          <span className="font-semibold text-slate-700">
                            تتبع الخطأ:
                          </span>
                          <pre className="mt-1 text-xs text-slate-600 overflow-auto max-h-32">
                            {error.stackTrace}
                          </pre>
                        </div>
                      )}
                      {error.context &&
                        Object.keys(error.context).length > 0 && (
                          <div>
                            <span className="font-semibold text-slate-700">
                              سياق:
                            </span>
                            <pre className="mt-1 text-xs text-slate-600 overflow-auto max-h-32">
                              {JSON.stringify(error.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      {error.resolved && (
                        <div className="mt-2 p-2 bg-emerald-100 rounded">
                          <span className="font-semibold text-emerald-700">
                            تم الحل:
                          </span>
                          <p className="text-emerald-600">
                            {error.resolutionNote}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => toggleExpand(error.id)}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-3" /> إخفاء التفاصيل
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3" /> عرض التفاصيل
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {!error.resolved && (
                    <button
                      onClick={() => setSelectedError(error)}
                      className="px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckSquare className="size-4" />
                      حل
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              حل الخطأ
            </h3>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">{selectedError.message}</p>
            </div>

            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="ملاحظات الحل..."
              className="w-full p-3 border border-slate-300 rounded-lg text-sm min-h-[100px]"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedError(null);
                  setResolutionNote("");
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onResolve(selectedError.id, resolutionNote);
                  setSelectedError(null);
                  setResolutionNote("");
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                تأكيد الحل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: ErrorStats
// ============================================================================

function ErrorStats({
  stats,
  isLoading,
}: {
  stats?: {
    byCategory: Array<{ category: string; count: number }>;
    total: number;
  };
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-4">توزيع الأخطاء</h3>

      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-slate-900">
          {stats?.total || 0}
        </div>
        <div className="text-sm text-slate-500">خطأ في آخر 24 ساعة</div>
      </div>

      <div className="space-y-3">
        {stats?.byCategory?.slice(0, 6).map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-slate-600">{item.category}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-500 rounded-full"
                  style={{
                    width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-slate-900 w-8 text-left">
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: HealthPage
// ============================================================================

export default function HealthPage() {
  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useGetHealthQuery();
  const { data: services, isLoading: servicesLoading } =
    useGetServiceHealthQuery();
  const { data: errorStats, isLoading: statsLoading } =
    useGetErrorStatsQuery(24);
  const { data: errors, isLoading: errorsLoading } = useGetErrorsQuery({
    hours: 24,
    limit: 10,
  });
  const [resolveError] = useResolveErrorMutation();

  const handleResolve = async (id: string, note: string) => {
    await resolveError({ id, note });
  };

  // Combine health check results with services
  const allComponents = health
    ? {
        ...health.info,
        ...health.error,
      }
    : {};

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="صحة النظام"
        description="مراقبة شاملة لأداء الخادم والخدمات الخارجية"
        icon={Activity}
        actions={
          <ActionButton
            variant="outline"
            size="md"
            onClick={() => refetchHealth()}
            disabled={healthLoading}
          >
            <RefreshCw
              className={`size-4 mr-1 ${healthLoading ? "animate-spin" : ""}`}
            />
            تحديث
          </ActionButton>
        }
      />

      {/* Overall Health Status */}
      <OverallHealthCard health={health} isLoading={healthLoading} />

      {/* Component Health Grid - Shows all components from health check */}
      {healthLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : Object.keys(allComponents).length > 0 ? (
        <>
          <h3 className="text-lg font-semibold text-slate-900">
            حالة المكونات
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(allComponents).map(([name, detail]) => (
              <ComponentHealthCard key={name} name={name} detail={detail} />
            ))}
          </div>
        </>
      ) : null}

      {/* External Services Status */}
      {(servicesLoading || (services && services.length > 0)) && (
        <>
          <h3 className="text-lg font-semibold text-slate-900">
            الخدمات الخارجية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {servicesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))
              : services?.map((service) => (
                  <div
                    key={service.serviceName}
                    className={`rounded-xl p-4 shadow-sm border ${
                      service.status === "UP"
                        ? "bg-emerald-50 border-emerald-200"
                        : service.status === "DEGRADED"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`p-2 rounded-lg ${
                          service.status === "UP"
                            ? "bg-emerald-100"
                            : service.status === "DEGRADED"
                              ? "bg-amber-100"
                              : "bg-red-100"
                        }`}
                      >
                        <Server
                          className={`size-5 ${
                            service.status === "UP"
                              ? "text-emerald-600"
                              : service.status === "DEGRADED"
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {service.displayName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {service.serviceName}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">الحالة:</span>
                        <span
                          className={`font-medium ${
                            service.status === "UP"
                              ? "text-emerald-600"
                              : service.status === "DEGRADED"
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {service.status === "UP"
                            ? "يعمل"
                            : service.status === "DEGRADED"
                              ? "منخفض الأداء"
                              : "متوقف"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">وقت الاستجابة:</span>
                        <span className="font-medium">
                          {service.responseTime}ms
                        </span>
                      </div>
                      {service.lastError && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                          آخر خطأ: {service.lastError}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </>
      )}

      {/* Errors Section */}
      <h3 className="text-lg font-semibold text-slate-900">
        الأخطاء والإحصائيات
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ErrorStats stats={errorStats} isLoading={statsLoading} />
        </div>

        <div className="lg:col-span-2">
          <ErrorLogTable
            errors={errors}
            isLoading={errorsLoading}
            onResolve={handleResolve}
          />
        </div>
      </div>
    </div>
  );
}
