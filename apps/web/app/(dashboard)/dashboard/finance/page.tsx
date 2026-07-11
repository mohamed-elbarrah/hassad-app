"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useGetFinanceMetricsQuery,
  useGetRevenueTrendQuery,
  useGetAgingQuery,
  useGetFinanceActionsQuery,
  useGetTopClientsQuery,
  useGetPaymentMethodsQuery,
  useGetLedgerQuery,
  useGetInvoicesQuery,
} from "@/features/finance/financeApi";
import {
  FinanceDateRangePicker,
  type RangeValue,
  type DateRange,
} from "@/components/dashboard/finance/FinanceDateRangePicker";
import { RevenueTrendChart } from "@/components/dashboard/finance/RevenueTrendChart";
import { PaymentMethodChart } from "@/components/dashboard/finance/PaymentMethodChart";
import { AgingChart } from "@/components/dashboard/finance/AgingChart";
import { ActionQueue } from "@/components/dashboard/finance/ActionQueue";
import { TopClientsTable } from "@/components/dashboard/finance/TopClientsTable";
import { ModuleQuickCard } from "@/components/dashboard/finance/ModuleQuickCard";
import { FinancePageHeader } from "@/components/dashboard/finance/shared/FinancePageHeader";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { DataTable } from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Users,
  FileText,
  Receipt,
  Calendar,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";

export default function FinanceDashboardPage() {
  const [range, setRange] = useState<RangeValue>("year");
  const [dates, setDates] = useState<DateRange>(() => {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date();
    from.setMonth(0, 1);
    return { from: from.toISOString().split("T")[0], to };
  });

  const handleRangeChange = (value: RangeValue, newDates: DateRange) => {
    setRange(value);
    setDates(newDates);
  };

  const params = useMemo(() => ({ from: dates.from, to: dates.to }), [dates]);

  const groupBy = useMemo(() => {
    switch (range) {
      case "week":
        return "day";
      case "month":
        return "day";
      case "quarter":
        return "month";
      case "year":
        return "month";
      default:
        return "day";
    }
  }, [range]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: metrics, isLoading: metricsLoading } =
    useGetFinanceMetricsQuery(params);

  const { data: trend, isLoading: trendLoading } = useGetRevenueTrendQuery({
    ...params,
    groupBy,
  });

  const { data: aging, isLoading: agingLoading } = useGetAgingQuery();

  const { data: actions, isLoading: actionsLoading } =
    useGetFinanceActionsQuery();

  const { data: topClients, isLoading: clientsLoading } = useGetTopClientsQuery(
    { ...params, limit: 5 },
  );

  const { data: paymentMethods, isLoading: methodsLoading } =
    useGetPaymentMethodsQuery(params);

  const { data: ledgerData, isLoading: ledgerLoading } = useGetLedgerQuery({
    limit: 6,
    page: 1,
  });

  const { data: invoicesData } = useGetInvoicesQuery({ limit: 1 });

  const isLoading =
    metricsLoading ||
    trendLoading ||
    agingLoading ||
    actionsLoading ||
    clientsLoading ||
    methodsLoading ||
    ledgerLoading;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <FinancePageHeader
        title="لوحة التحكم المالية"
        description="نظرة شاملة على الأداء المالي للفترة المختارة"
        icon={DollarSign}
        actions={
          <FinanceDateRangePicker value={range} onChange={handleRangeChange} />
        }
      />

      {/* ── KPI Row 1 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="الإيرادات"
          value={<CurrencyDisplay amount={metrics?.revenue ?? 0} />}
          icon={DollarSign}
          variant="default"
          trend={
            metrics?.revenueChange && metrics.revenueChange >= 0 ? "up" : "down"
          }
          trendValue={`${Math.abs(metrics?.revenueChange ?? 0).toFixed(2)}%`}
        />
        <StatCard
          title="المبالغ المستحقة"
          value={<CurrencyDisplay amount={metrics?.pending ?? 0} />}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="نسبة التحصيل"
          value={`${(metrics?.collectionRate ?? 0).toFixed(1)}%`}
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="صافي الربح"
          value={<CurrencyDisplay amount={metrics?.netProfit ?? 0} />}
          icon={Wallet}
          variant="default"
          trend={
            metrics?.netProfitChange && metrics.netProfitChange >= 0
              ? "up"
              : "down"
          }
          trendValue={`${Math.abs(metrics?.netProfitChange ?? 0).toFixed(2)}%`}
        />
      </div>

      {/* ── KPI Row 2 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="المدفوعات الفاشلة"
          value={<CurrencyDisplay amount={metrics?.failedPaymentsValue ?? 0} />}
          icon={AlertTriangle}
          variant={
            (metrics?.failedPaymentsCount ?? 0) > 0 ? "danger" : "default"
          }
        />
        <StatCard
          title="متوسط قيمة الفاتورة"
          value={<CurrencyDisplay amount={metrics?.averageInvoice ?? 0} />}
          icon={Receipt}
          variant="default"
        />
        <StatCard
          title="العملاء النشطون"
          value={metrics?.activeClients ?? 0}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="إجمالي الرواتب"
          value={<CurrencyDisplay amount={metrics?.salariesTotal ?? 0} />}
          icon={CreditCard}
          variant="default"
          trend={
            metrics?.salariesChange && metrics.salariesChange >= 0
              ? "up"
              : "down"
          }
          trendValue={`${Math.abs(metrics?.salariesChange ?? 0).toFixed(2)}%`}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={trend || []} isLoading={trendLoading} />
        </div>
        <div className="lg:col-span-1">
          <PaymentMethodChart
            data={paymentMethods || []}
            isLoading={methodsLoading}
          />
        </div>
      </div>

      {/* ── Intelligence Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AgingChart data={aging || []} isLoading={agingLoading} />
        <ActionQueue actions={actions || []} isLoading={actionsLoading} />
        <TopClientsTable
          clients={topClients || []}
          isLoading={clientsLoading}
        />
      </div>

      {/* ── Bottom Row: Activity + Quick Links ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Ledger Activity */}
        <SurfaceCard
          className="lg:col-span-2 border-none shadow-md"
          title="آخر النشاطات المالية"
          description="سجل العمليات المالية الأخيرة"
          icon={ShieldCheck}
          action={
            <Link href="/dashboard/finance/ledger">
              <ActionButton variant="outline" size="sm">
                عرض السجل الكامل
              </ActionButton>
            </Link>
          }
        >
          <DataTable
            columns={[
              { id: "action", label: "العملية" },
              { id: "entity", label: "الكيان" },
              { id: "user", label: "المستخدم" },
              { id: "date", label: "التاريخ", align: "left" },
            ]}
            data={ledgerData?.items || []}
            isLoading={ledgerLoading}
            isError={false}
            emptyState={{
              icon: ShieldCheck,
              message: "لا توجد سجلات حالياً",
              hint: "ستظهر العمليات المالية هنا فور حدوثها.",
            }}
            renderRow={(log) => (
              <tr className="border-b-[1.5px] border-portal-divider">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                    <span className="font-bold text-sm">{log.action}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono text-[10px] uppercase bg-badge-gray-bg px-2 py-0.5 rounded">
                    {log.entity}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-portal-note-text">
                  {log.userId || "System"}
                </td>
                <td className="px-5 py-4 text-left text-xs text-portal-note-text font-mono">
                  {formatDate(log.createdAt)}
                </td>
              </tr>
            )}
          />
        </SurfaceCard>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <ModuleQuickCard
            title="الفواتير"
            href="/dashboard/finance/invoices"
            icon={FileText}
            badge={metrics?.pendingLateCount}
            description="إصدار ومتابعة الفواتير"
            meta={[
              {
                value: metrics?.invoicesCount ?? 0,
                label: "مصدرة",
                accent: "neutral",
              },
              {
                value: metrics?.pendingLateCount ?? 0,
                label: "متأخرة",
                accent: metrics?.pendingLateCount > 0 ? "danger" : "neutral",
              },
            ]}
            progress={metrics?.collectionRate}
            progressLabel="نسبة التحصيل"
            tint="blue"
          />
          <ModuleQuickCard
            title="الرواتب"
            href="/dashboard/finance/payroll"
            icon={Wallet}
            description="صرف الرواتب والمستحقات"
            meta={[
              {
                value:
                  actions?.filter((a) => a.type === "PENDING_SALARY").length ??
                  0,
                label: "معلق للصرف",
                accent: "alert",
              },
            ]}
            tint="amber"
          />
          <ModuleQuickCard
            title="سجل التدقيق"
            href="/dashboard/finance/ledger"
            icon={Calendar}
            description="مراجعة التدقيق المالي"
            meta={[
              {
                value:
                  ledgerData?.items?.filter(
                    (l) =>
                      new Date(l.createdAt).toDateString() ===
                      new Date().toDateString(),
                  ).length ?? 0,
                label: "عملية اليوم",
                accent: "neutral",
              },
            ]}
            tint="slate"
          />
          <ModuleQuickCard
            title="العقود"
            href="/dashboard/finance/contracts"
            icon={TrendingUp}
            description="الوضع المالي للعقود"
            meta={[
              {
                value: `${Math.round(metrics?.collectionRate ?? 0)}%`,
                label: "نسبة التحصيل",
                accent:
                  (metrics?.collectionRate ?? 0) >= 80
                    ? "success"
                    : (metrics?.collectionRate ?? 0) >= 50
                      ? "alert"
                      : "danger",
              },
            ]}
            tint="rose"
          />
        </div>
      </div>
    </div>
  );
}
