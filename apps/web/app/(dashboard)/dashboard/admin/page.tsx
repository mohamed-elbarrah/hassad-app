"use client";

import { useMemo } from "react";
import { LayoutDashboard, AlertTriangle, Activity, Users, TrendingUp, DollarSign, CheckCircle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { StatCard } from "@/components/design-system/StatCard";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  useGetAdminStatsQuery,
  useGetAdminAlertsQuery,
  useGetAdminDashboardAttentionQuery,
  useGetAdminDashboardRecentActivityQuery,
  useGetAdminDashboardTeamWorkloadQuery,
  useGetAdminTrendsQuery,
} from "@/features/admin/adminApi";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetAdminStatsQuery();
  const { data: alerts } = useGetAdminAlertsQuery();
  const { data: attention } = useGetAdminDashboardAttentionQuery();
  const { data: recentActivity } = useGetAdminDashboardRecentActivityQuery();
  const { data: teamWorkload } = useGetAdminDashboardTeamWorkloadQuery();
  useGetAdminTrendsQuery();

  const attentionItems = useMemo(() => {
    const items: { label: string; value: string; href?: string; severity: "HIGH" | "MEDIUM" | "LOW" }[] = [];

    if (alerts) {
      const highSeverityCategories = [
        alerts.overdueTasks,
        alerts.agedInvoices,
        alerts.escalatedDisputes,
      ] as const;
      for (const cat of highSeverityCategories) {
        if (cat.count > 0) {
          items.push({ label: cat.label, value: `${cat.count}`, severity: "HIGH" });
        }
      }
      const mediumCategories = [
        alerts.expiringContracts,
        alerts.failedWebhooks,
        alerts.pendingRequests,
      ] as const;
      for (const cat of mediumCategories) {
        if (cat.count > 0) {
          items.push({ label: cat.label, value: `${cat.count}`, severity: "MEDIUM" });
        }
      }
    }

    if (attention) {
      for (const p of attention.stalledProjects) {
        items.push({ label: p.name, value: "مشروع متعطل", href: `/projects/${p.id}`, severity: "HIGH" });
      }
      for (const r of attention.newRequests) {
        items.push({ label: r.companyName, value: "طلب جديد", href: `/requests/${r.id}`, severity: "HIGH" });
      }
      for (const d of attention.openDisputes) {
        items.push({ label: d.title, value: `نزاع ${d.ticketNumber}`, href: `/disputes/${d.id}`, severity: "HIGH" });
      }
      for (const i of attention.overdueInvoices) {
        items.push({ label: `فاتورة ${i.invoiceNumber}`, value: `${formatCurrency(i.amount)}`, severity: "HIGH" });
      }
      for (const a of attention.unacknowledgedAlerts) {
        items.push({ label: a.task.title, value: "تنبيه غير مؤكد", severity: "HIGH" });
      }
    }

    return items.slice(0, 8);
  }, [alerts, attention]);

  const members = teamWorkload?.members ?? [];
  const overloadedCount = useMemo(
    () => members.filter((m) => m.workloadStatus === "OVERLOADED").length,
    [members],
  );

  if (statsLoading) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[30px]" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-[30px]" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col gap-5" dir="rtl">
        <PageIntro
          title="لوحة التحكم"
          icon={LayoutDashboard}
        />
        <AdminEmptyState
          icon={AlertTriangle}
          title="تعذر تحميل البيانات"
          description="حدث خطأ أثناء تحميل إحصائيات لوحة التحكم. يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="لوحة التحكم"
        description="نظرة عامة على أداء المنصة والمؤشرات الرئيسية"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="المستخدمون النشطون"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="المشاريع الجارية"
          value={stats?.activeProjects ?? 0}
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="العملاء النشطون"
          value={stats?.activeClients ?? 0}
          icon={CheckCircle}
          variant="default"
        />
        <StatCard
          title="الإيرادات الشهرية"
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          icon={DollarSign}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SurfaceCard title="ما يحتاج اهتماماً" icon={AlertTriangle} className="lg:col-span-1">
          {attentionItems.length === 0 ? (
            <p className="text-sm text-portal-note-text text-center py-6">لا توجد عناصر تحتاج اهتماماً</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {attentionItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl border border-portal-card-border"
                >
                  <div
                    className={`mt-1 shrink-0 w-2 h-2 rounded-full ${
                      item.severity === "HIGH"
                        ? "bg-danger-500"
                        : item.severity === "MEDIUM"
                          ? "bg-alert-500"
                          : "bg-neutral-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-natural-100 truncate">{item.label}</p>
                    {item.value && (
                      <p className="text-xs text-portal-note-text truncate mt-0.5">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="آخر النشاطات" icon={Activity} className="lg:col-span-1">
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-sm text-portal-note-text text-center py-6">لا توجد نشاطات حديثة</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-portal-card-border"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-badge-gray-bg">
                    <Activity className="h-4 w-4 text-secondary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-natural-100 truncate">{item.userName ?? "نظام"}</p>
                    <p className="text-xs text-portal-note-text truncate">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="حالة الفريق" icon={Users} className="lg:col-span-1">
          {members.length === 0 ? (
            <p className="text-sm text-portal-note-text text-center py-6">لا توجد بيانات للفريق</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-3">
                <span className="text-xs text-portal-note-text">
                  {members.filter((m) => m.workloadStatus === "AVAILABLE").length} متاح
                </span>
                <span className="text-xs text-portal-note-text">
                  {overloadedCount} محمَّل
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.slice(0, 6).map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 rounded-xl border border-portal-card-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          member.workloadStatus === "OVERLOADED"
                            ? "bg-danger-500"
                            : member.workloadStatus === "BUSY"
                              ? "bg-alert-500"
                              : "bg-success-500"
                        }`}
                      />
                      <span className="text-sm text-natural-100 truncate">{member.userName}</span>
                    </div>
                    <span className="text-xs text-portal-note-text shrink-0">
                      {member.activeTasksCount} مهمة
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
