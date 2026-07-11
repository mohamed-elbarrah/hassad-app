"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Users,
  AlertTriangle,
  BarChart3,
  RotateCcw,
  PieChart,
  Clock,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { DataTable } from "@/components/design-system/DataTable";
import { Skeleton } from "@/components/design-system/Skeleton";
import { EmptyState } from "@/components/design-system/EmptyState";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { TimeRangeSelector, getTimeRangeParams, type TimeRange } from "@/components/design-system/TimeRangeSelector";
import { MonthlyComparisonBarChart } from "@/components/design-system/MonthlyComparisonBarChart";
import { SpendDistributionDonutChart } from "@/components/design-system/SpendDistributionDonutChart";
import { useGetAdminFinanceOverviewQuery } from "@/features/admin/adminApi";
import { useCurrency } from "@/hooks/useCurrency";
import { PAYMENT_METHOD_AR } from "@hassad/shared";
import type { ReportTimeline, ReportPlatformDistribution } from "@/features/portal/portalApi";

export default function AdminFinancePage() {
  const { fmtAmount, fmtNumber, currency } = useCurrency();
  const [timeRange, setTimeRange] = useState<TimeRange>("last12months");
  const rangeParams = getTimeRangeParams(timeRange);
  const { data: overview, isLoading } = useGetAdminFinanceOverviewQuery(rangeParams);
  const metrics = overview?.metrics;
  const revenueTrend = overview?.revenueTrend;
  const aging = overview?.aging;
  const cashflow = overview?.cashflow;
  const topClients = overview?.topClients;
  const alerts = overview?.alerts;
  const refundRate = overview?.refundRate;
  const paymentMethodDistribution = overview?.paymentMethodDistribution;
  const topOverdueInvoices = overview?.topOverdueInvoices;
  const paidVsUnpaid = overview?.paidVsUnpaid;

  const timeline: ReportTimeline | undefined = useMemo(() => {
    if (!revenueTrend || revenueTrend.length === 0) return undefined;
    return {
      labels: revenueTrend.map((r) => r.label),
      datasets: [
        {
          label: "الإيرادات",
          data: revenueTrend.map((r) => r.income),
          metric: "spend",
        },
      ],
    };
  }, [revenueTrend]);

  const paidVsUnpaidTimeline: ReportTimeline | undefined = useMemo(() => {
    if (!paidVsUnpaid) return undefined;
    return {
      labels: ["المدفوع", "غير المدفوع"],
      datasets: [
        {
          label: "المبلغ",
          data: [paidVsUnpaid.paid.amount, paidVsUnpaid.unpaid.amount],
          metric: "spend",
        },
      ],
    };
  }, [paidVsUnpaid]);

  const paymentMethodChart: ReportPlatformDistribution[] | undefined = useMemo(() => {
    if (!paymentMethodDistribution || paymentMethodDistribution.length === 0) return undefined;
    return paymentMethodDistribution.map((p: any) => ({
      platform: PAYMENT_METHOD_AR[p.method] ?? p.method,
      spend: p.amount,
      percent: p.percentage,
    }));
  }, [paymentMethodDistribution]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" dir="rtl">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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

      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.slice(0, 3).map((a) => (
            <StatusBanner
              key={a.id}
              variant={a.severity === "HIGH" ? "danger" : "warning"}
              title={a.type}
            >{`${a.client} · ${fmtAmount(a.amount)} ${currency.symbol}`}</StatusBanner>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="إجمالي الإيرادات"
          value={`${fmtAmount(metrics?.revenue)} ${currency.symbol}`}
          icon={DollarSign}
          trend={(metrics?.revenueChange ?? 0) >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics?.revenueChange ?? 0)}%`}
        />
        <StatCard
          title="الفواتير المعلقة"
          value={`${fmtAmount(metrics?.pending)} ${currency.symbol}`}
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
          value={`${fmtAmount(metrics?.netProfit)} ${currency.symbol}`}
          icon={TrendingUp}
          trend={(metrics?.netProfitChange ?? 0) >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics?.netProfitChange ?? 0)}%`}
        />
        <StatCard
          title="معدل الاسترداد"
          value={refundRate != null ? `${refundRate}%` : "—"}
          icon={RotateCcw}
          trend={refundRate != null && refundRate > 5 ? "down" : "up"}
          trendValue={refundRate != null ? `${refundRate}%` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <SurfaceCard title="اتجاه الإيرادات الشهرية" icon={BarChart3}>
          <div className="h-64">
            <MonthlyComparisonBarChart timeline={timeline} />
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
                    {fmtAmount(a.amount)} {currency.symbol}
                  </span>
                  <span className="text-xs text-portal-note-text">
                    ({a.count} فاتورة)
                  </span>
                </div>
              </div>
            ))}
            {(!aging || aging.length === 0) && (
              <EmptyState icon={Clock} title="لا توجد فواتير مستحقة" hint="جميع الفواتير مدفوعة أو في الموعد المحدد" />
            )}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        <SurfaceCard title="توزيع طرق الدفع" icon={PieChart}>
          <div className="h-64">
            <SpendDistributionDonutChart data={paymentMethodChart ?? []} />
          </div>
        </SurfaceCard>

        {/* Paid vs Unpaid */}
        <SurfaceCard title="المدفوع مقابل غير المدفوع" icon={BarChart3}>
          <div className="h-64">
            <MonthlyComparisonBarChart timeline={paidVsUnpaidTimeline} />
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
                    وارد: {fmtAmount(c.income)} {currency.symbol}
                  </span>
                  <span className="text-sm text-danger-600 font-medium">
                    صادر: {fmtAmount(c.expenses)} {currency.symbol}
                  </span>
                </div>
              </div>
            ))}
            {(!cashflow || cashflow.length === 0) && (
              <EmptyState icon={TrendingUp} title="لا توجد بيانات تدفق نقدي" />
            )}
          </div>
        </SurfaceCard>

        {/* Top Overdue Invoices */}
        <SurfaceCard title="أكثر 5 فواتير متأخرة" icon={Clock}>
          <DataTable
            columns={[
              { id: "invoice", label: "الفاتورة" },
              { id: "client", label: "العميل" },
              { id: "amount", label: "المبلغ" },
              { id: "days", label: "أيام التأخير" },
            ]}
            data={topOverdueInvoices ?? []}
            isLoading={false}
            isError={false}
            emptyState={{
              icon: Clock,
              message: "لا توجد فواتير متأخرة",
              hint: "جميع الفواتير مدفوعة أو في الموعد المحدد",
            }}
            renderRow={(inv: any) => (
              <tr key={inv.id} className="border-b border-portal-divider">
                <td className="px-4 py-3 text-sm font-medium">
                  {inv.invoiceNumber}
                </td>
                <td className="px-4 py-3 text-sm text-portal-note-text">
                  {inv.clientName}
                </td>
                <td className="px-4 py-3 text-sm">
                  {fmtAmount(inv.amount)} {currency.symbol}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={inv.daysOverdue > 30 ? "CRITICAL" : "LATE"}
                    label={`${inv.daysOverdue} يوم`}
                  />
                </td>
              </tr>
            )}
          />
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {fmtAmount(c.revenue)} {currency.symbol}
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
