"use client";

import {
  Cable,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { MetricCard } from "@/components/design-system/MetricCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import {
  useGetAdminIntegrationsSyncStatusQuery,
  useGetAdminIntegrationsGatewaysQuery,
} from "@/features/admin/adminApi";

const SERVICE_STATUS_ICON: Record<string, typeof Wifi> = {
  healthy: Wifi,
  degraded: AlertTriangle,
  down: XCircle,
  unchecked: WifiOff,
};

const SERVICE_STATUS_COLOR: Record<string, string> = {
  healthy: "text-success-600",
  degraded: "text-alert-600",
  down: "text-danger-600",
  unchecked: "text-neutral-300",
};

const SERVICE_STATUS_BG: Record<string, string> = {
  healthy: "bg-success-100/30 border-success-200",
  degraded: "bg-alert-100/30 border-alert-200",
  down: "bg-danger-100/30 border-danger-200",
  unchecked: "bg-neutral-50 border-neutral-200",
};

function formatMs(ms: number | null) {
  if (ms === null) return "—";
  return ms + " مللي";
}

function SyncStatusSection() {
  const { data, isLoading, isError } = useGetAdminIntegrationsSyncStatusQuery();

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[30px]" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-[30px]" />
      </>
    );
  }

  if (isError || !data) {
    return (
      <SurfaceCard title="حالة الخدمات" icon={Cable}>
        <AdminEmptyState
          icon={Cable}
          title="تعذر تحميل حالة التكاملات"
          description="حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً."
        />
      </SurfaceCard>
    );
  }

  const { summary, items } = data;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard title="الإجمالي" value={summary.total} icon={Cable} />
        <MetricCard
          title="سليم"
          value={summary.healthy}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="منخفض"
          value={summary.degraded}
          icon={AlertTriangle}
          variant="warning"
        />
        <MetricCard
          title="متوقف"
          value={summary.down}
          icon={XCircle}
          variant="danger"
        />
      </div>

      <SurfaceCard title="قائمة الخدمات" icon={Cable}>
        {items.length === 0 ? (
          <AdminEmptyState
            icon={Cable}
            title="لا توجد خدمات"
            description="لم يتم العثور على أي خدمات تكامل."
          />
        ) : (
          <div className="space-y-3">
            {items.map((service) => (
              <div
                key={service.serviceName}
                className={`flex items-center justify-between rounded-xl border p-4 ${SERVICE_STATUS_BG[service.status] || "bg-neutral-50 border-neutral-200"}`}
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = SERVICE_STATUS_ICON[service.status] || WifiOff;
                    return (
                      <Icon
                        className={`h-5 w-5 ${SERVICE_STATUS_COLOR[service.status] || "text-neutral-300"}`}
                      />
                    );
                  })()}
                  <div>
                    <p className="text-sm font-medium text-natural-100">
                      {service.serviceName}
                    </p>
                    <p className="text-xs text-portal-note-text">
                      {formatMs(service.responseTime)} ·{" "}
                      {service.consecutiveFailures > 0
                        ? service.consecutiveFailures + " فشل متتالي"
                        : "لا يوجد فشل"}
                    </p>
                    {service.lastError && (
                      <p className="text-xs text-danger-600 mt-0.5">
                        {service.lastError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      service.status === "healthy"
                        ? "bg-success-100 text-success-700"
                        : service.status === "degraded"
                          ? "bg-alert-100 text-alert-700"
                          : service.status === "down"
                            ? "bg-danger-100 text-danger-700"
                            : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        service.status === "healthy"
                          ? "bg-success-500"
                          : service.status === "degraded"
                            ? "bg-alert-500"
                            : service.status === "down"
                              ? "bg-danger-500"
                              : "bg-neutral-400"
                      }`}
                    />
                    {service.status === "healthy"
                      ? "سليم"
                      : service.status === "degraded"
                        ? "منخفض"
                        : service.status === "down"
                          ? "متوقف"
                          : "غير محدد"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </>
  );
}

function GatewaysSection() {
  const { data, isLoading, isError } = useGetAdminIntegrationsGatewaysQuery();

  if (isLoading) {
    return <Skeleton className="h-64 rounded-[30px]" />;
  }

  if (isError || !data) {
    return (
      <SurfaceCard title="بوابات الدفع" icon={Cable}>
        <AdminEmptyState
          icon={Cable}
          title="تعذر تحميل البوابات"
          description="حدث خطأ أثناء جلب البيانات. يرجى المحاولة لاحقاً."
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="بوابات الدفع" icon={Cable}>
      {data.length === 0 ? (
        <AdminEmptyState
          icon={Cable}
          title="لا توجد بوابات"
          description="لم يتم إضافة أي بوابات دفع بعد."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-divider">
                <th className="py-3 px-4 text-right text-portal-note-text font-medium">
                  الاسم
                </th>
                <th className="py-3 px-4 text-right text-portal-note-text font-medium">
                  النوع
                </th>
                <th className="py-3 px-4 text-right text-portal-note-text font-medium">
                  الحالة
                </th>
                <th className="py-3 px-4 text-right text-portal-note-text font-medium">
                  تاريخ الإضافة
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((gateway) => (
                <tr
                  key={gateway.id}
                  className="border-b border-portal-divider last:border-0"
                >
                  <td className="py-3 px-4 text-natural-100 font-medium">
                    {gateway.name}
                  </td>
                  <td className="py-3 px-4 text-portal-note-text">
                    {gateway.type}
                  </td>
                  <td className="py-3 px-4">
                    <AdminStatusBadge
                      domain="client"
                      status={gateway.isActive ? "ACTIVE" : "STOPPED"}
                    />
                  </td>
                  <td className="py-3 px-4 text-sm text-portal-note-text">
                    {new Date(gateway.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}

export default function AdminIntegrationsPage() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="التكاملات"
        description="مراقبة حالة الخدمات المتصلة وبوابات الدفع"
        icon={Cable}
      />

      <div className="flex flex-col gap-5">
        <SyncStatusSection />
        <GatewaysSection />
      </div>
    </div>
  );
}
