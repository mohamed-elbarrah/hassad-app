"use client";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Users,
  AlertTriangle,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { DataTable } from "@/components/design-system/DataTable";
import { Skeleton } from "@/components/design-system/Skeleton";
import { useGetAdminFinanceOverviewQuery } from "@/features/admin/adminApi";
import { useCurrency } from "@/hooks/useCurrency";

export default function AdminFinancePage() {
  const { fmtAmount, fmtNumber } = useCurrency();
  const { data: overview, isLoading } = useGetAdminFinanceOverviewQuery();
  const metrics = overview?.metrics;
  const revenueTrend = overview?.revenueTrend;
  const aging = overview?.aging;
  const cashflow = overview?.cashflow;
  const topClients = overview?.topClients;
  const alerts = overview?.alerts;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="المالية والإيرادات"
        description="نظرة شاملة على الوضع المالي للمنصة"
        icon={DollarSign}
      />

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.slice(0, 3).map((a) => (
            <StatusBanner
              key={a.id}
              variant={a.severity === "HIGH" ? "danger" : "warning"}
              title={a.type}
            >{`${a.client} · ${a.amount?.toLocaleString()} ر.س`}</StatusBanner>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الإيرادات"
          value={`${fmtAmount(metrics?.revenue)} ر.س`}
          icon={DollarSign}
          trend={(metrics?.revenueChange ?? 0) >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics?.revenueChange ?? 0)}%`}
        />
        <StatCard
          title="الفواتير المعلقة"
          value={`${fmtAmount(metrics?.pending)} ر.س`}
          icon={FileText}
          extra={
            <span className="text-xs text-danger-500">
              {metrics?.pendingLateCount ?? 0} متأخرة
            </span>
          }
        />
        <StatCard
          title="نسبة التحصيل"
          value={`${metrics?.collectionRate ?? 0}%`}
          icon={CreditCard}
          trend={metrics?.collectionRate >= 80 ? "up" : "down"}
          trendValue={`${metrics?.collectionRate ?? 0}%`}
        />
        <StatCard
          title="صافي الربح"
          value={`${metrics?.netProfit?.toLocaleString() ?? 0} ر.س`}
          icon={TrendingUp}
          trend={(metrics?.netProfitChange ?? 0) >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics?.netProfitChange ?? 0)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <SurfaceCard title="اتجاه الإيرادات الشهرية" icon={TrendingUp}>
          <div className="space-y-2">
            {(revenueTrend ?? []).slice(-6).map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-portal-divider last:border-0"
              >
                <span className="text-sm text-portal-note-text">{r.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {r.income?.toLocaleString()} ر.س
                  </span>
                  {r.income > (revenueTrend?.[i - 1]?.income ?? 0) ? (
                    <TrendingUp className="size-4 text-success-500" />
                  ) : (
                    <TrendingDown className="size-4 text-danger-500" />
                  )}
                </div>
              </div>
            ))}
            {(!revenueTrend || revenueTrend.length === 0) && (
              <p className="text-center text-portal-note-text py-8">
                لا توجد بيانات إيرادات
              </p>
            )}
          </div>
        </SurfaceCard>

        {/* AR Aging */}
        <SurfaceCard title="توزيع الأعمار المستحقة" icon={AlertTriangle}>
          <div className="space-y-2">
            {(aging ?? []).map((a) => (
              <div
                key={a.label}
                className="flex items-center justify-between py-1.5 border-b border-portal-divider last:border-0"
              >
                <span className="text-sm text-portal-note-text">{a.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {a.amount?.toLocaleString()} ر.س
                  </span>
                  <span className="text-xs text-portal-note-text">
                    ({a.count} فاتورة)
                  </span>
                </div>
              </div>
            ))}
            {(!aging || aging.length === 0) && (
              <p className="text-center text-portal-note-text py-8">
                لا توجد فواتير مستحقة
              </p>
            )}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow */}
        <SurfaceCard title="التدفق النقدي" icon={DollarSign}>
          <div className="space-y-2">
            {(cashflow ?? []).slice(-6).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-portal-divider last:border-0"
              >
                <span className="text-sm text-portal-note-text">{c.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-success-600 font-medium">
                    وارد: {c.income?.toLocaleString()} ر.س
                  </span>
                  <span className="text-sm text-danger-600 font-medium">
                    صادر: {c.expenses?.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            ))}
            {(!cashflow || cashflow.length === 0) && (
              <p className="text-center text-portal-note-text py-8">
                لا توجد بيانات تدفق نقدي
              </p>
            )}
          </div>
        </SurfaceCard>

        {/* Top Clients */}
        <SurfaceCard title="أفضل 5 عملاء" icon={Users}>
          <DataTable
            columns={[
              { id: "name", label: "العميل" },
              { id: "revenue", label: "الإيرادات" },
              { id: "rate", label: "نسبة التحصيل" },
            ]}
            data={topClients ?? []}
            isLoading={false}
            isError={false}
            emptyState={{
              icon: Users,
              message: "لا توجد بيانات",
              hint: "لم يتم تسجيل أي إيرادات بعد",
            }}
            renderRow={(c: any) => (
              <tr key={c.clientId} className="border-b border-portal-divider">
                <td className="px-4 py-3 text-sm font-medium">
                  {c.companyName}
                </td>
                <td className="px-4 py-3 text-sm">
                  {c.revenue?.toLocaleString()} ر.س
                </td>
                <td className="px-4 py-3 text-sm">{c.collectionRate}%</td>
              </tr>
            )}
          />
        </SurfaceCard>
      </div>
    </div>
  );
}
