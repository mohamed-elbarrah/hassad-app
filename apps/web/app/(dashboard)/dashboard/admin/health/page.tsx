"use client";

import { useMemo } from "react";
import {
  HeartPulse,
  Database,
  Activity,
  Timer,
  MemoryStick,
  AlertTriangle,
  Users,
  Webhook,
  CheckCircle2,
  XCircle,
  Gauge,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { cn } from "@/lib/utils";
import { useGetAdminHealthQuery } from "@/features/admin/adminApi";

const fmtUptime = (seconds: number) =>
  Math.floor(seconds / 86400) +
  " يوم " +
  Math.floor((seconds % 86400) / 3600) +
  " ساعة";

export default function AdminHealthPage() {
  const { data, isLoading, isError } = useGetAdminHealthQuery();

  if (isError) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <AdminEmptyState
          icon={HeartPulse}
          title="حدث خطأ أثناء تحميل معلومات الصحة"
          description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  const statusColor = data?.status === "healthy" ? "bg-success-500" : "bg-danger-500";
  const statusText = data?.status === "healthy" ? "سليم" : "تدهور";
  const dbColor = data?.database === "connected" ? "bg-success-500" : "bg-danger-500";
  const dbText = data?.database === "connected" ? "متصل" : "منفصل";

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="صحة النظام"
        description="مراقبة أداء النظام وحالة الخدمات"
        icon={HeartPulse}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SurfaceCard title="حالة النظام" className="lg:col-span-1">
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-portal-card-border" />
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center",
                  statusColor,
                )}
              >
                {data?.status === "healthy" ? (
                  <CheckCircle2 className="h-10 w-10 text-white" />
                ) : (
                  <XCircle className="h-10 w-10 text-white" />
                )}
              </div>
              <p className="text-xl font-semibold text-natural-100">
                {statusText}
              </p>
              <p className="text-sm text-portal-note-text">
                آخر تحديث:{" "}
                {data?.timestamp
                  ? new Date(data.timestamp).toLocaleString("ar-SA")
                  : "—"}
              </p>
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="مؤشرات الأداء" className="lg:col-span-2">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  label: "درجة الصحة العامة",
                  value: data?.overallScore != null ? `${data.overallScore}%` : "—",
                  icon: Gauge,
                  color:
                    (data?.overallScore ?? 0) >= 80
                      ? "text-success-500"
                      : (data?.overallScore ?? 0) >= 50
                        ? "text-warning-500"
                        : "text-danger-500",
                },
                {
                  label: "قاعدة البيانات",
                  value: dbText,
                  icon: Database,
                  color: data?.database === "connected" ? "text-success-500" : "text-danger-500",
                },
                {
                  label: "وقت التشغيل",
                  value: data ? fmtUptime(data.uptime) : "—",
                  icon: Timer,
                  color: "text-natural-100",
                },
                {
                  label: "استخدام الذاكرة",
                  value: data ? `${(data.memoryUsage / 1024 / 1024).toFixed(1)} MB` : "—",
                  icon: MemoryStick,
                  color: "text-natural-100",
                },
                {
                  label: "المستخدمون النشطون (آخر ساعة)",
                  value: data?.activeUsersLastHour ?? "—",
                  icon: Users,
                  color: "text-natural-100",
                },
                {
                  label: "Webhooks معلقة",
                  value: data?.pendingWebhooks ?? "—",
                  icon: Webhook,
                  color:
                    (data?.pendingWebhooks ?? 0) > 10
                      ? "text-warning-500"
                      : "text-natural-100",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-portal-card-border p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <metric.icon className={cn("h-4 w-4", metric.color)} />
                    <p className="text-xs text-portal-note-text">
                      {metric.label}
                    </p>
                  </div>
                  <p className={cn("text-lg font-semibold", metric.color)}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard title="الخدمات">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : !data?.services || data.services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Activity className="h-8 w-8 text-portal-note-text mb-2" />
              <p className="text-sm text-portal-note-text">لا توجد خدمات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.services.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between rounded-xl border border-portal-card-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        svc.status === "healthy" || svc.status === "connected"
                          ? "bg-success-500"
                          : "bg-danger-500",
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-natural-100">
                        {svc.name}
                      </p>
                      <p className="text-xs text-portal-note-text">
                        {svc.responseTime}ms
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      svc.status === "healthy" || svc.status === "connected"
                        ? "text-success-500"
                        : "text-danger-500",
                    )}
                  >
                    {svc.status === "healthy" || svc.status === "connected"
                      ? "سليم"
                      : "معطل"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="الأخطاء والتنبيهات">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-portal-card-border"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  label: "أخطاء حديثة",
                  value: data?.recentErrors ?? 0,
                  icon: AlertTriangle,
                  className:
                    (data?.recentErrors ?? 0) > 0
                      ? "bg-danger-100/50 border-danger-200 text-danger-600"
                      : "bg-success-100/50 border-success-200 text-success-600",
                },
                {
                  label: "أخطاء غير محلولة",
                  value: data?.unresolvedErrors ?? 0,
                  icon: AlertTriangle,
                  className:
                    (data?.unresolvedErrors ?? 0) > 0
                      ? "bg-danger-100/50 border-danger-200 text-danger-600"
                      : "bg-success-100/50 border-success-200 text-success-600",
                },
              ].map((errItem) => (
                <div
                  key={errItem.label}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4",
                    errItem.className,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <errItem.icon className="h-4 w-4" />
                    <p className="text-sm font-medium">{errItem.label}</p>
                  </div>
                  <p className="text-xl font-semibold">{errItem.value}</p>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
