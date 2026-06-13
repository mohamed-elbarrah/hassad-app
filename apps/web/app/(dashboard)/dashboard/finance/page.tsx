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
import { FinanceKPICard } from "@/components/dashboard/finance/FinanceKPICard";
import { RevenueTrendChart } from "@/components/dashboard/finance/RevenueTrendChart";
import { PaymentMethodChart } from "@/components/dashboard/finance/PaymentMethodChart";
import { AgingChart } from "@/components/dashboard/finance/AgingChart";
import { ActionQueue } from "@/components/dashboard/finance/ActionQueue";
import { TopClientsTable } from "@/components/dashboard/finance/TopClientsTable";
import { ModuleQuickCard } from "@/components/dashboard/finance/ModuleQuickCard";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
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
  ArrowUpLeft,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";



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

  const params = useMemo(
    () => ({ from: dates.from, to: dates.to }),
    [dates],
  );

  const groupBy = useMemo(() => {
    switch (range) {
      case "week": return "day";
      case "month": return "day";
      case "quarter": return "month";
      case "year": return "month";
      default: return "day";
    }
  }, [range]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: metrics, isLoading: metricsLoading } =
    useGetFinanceMetricsQuery(params);

  const { data: trend, isLoading: trendLoading } =
    useGetRevenueTrendQuery({ ...params, groupBy });

  const { data: aging, isLoading: agingLoading } =
    useGetAgingQuery();

  const { data: actions, isLoading: actionsLoading } =
    useGetFinanceActionsQuery();

  const { data: topClients, isLoading: clientsLoading } =
    useGetTopClientsQuery({ ...params, limit: 5 });

  const { data: paymentMethods, isLoading: methodsLoading } =
    useGetPaymentMethodsQuery(params);

  const { data: ledgerData, isLoading: ledgerLoading } =
    useGetLedgerQuery({ limit: 6, page: 1 });

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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-natural-100">
            لوحة التحكم المالية
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            نظرة شاملة على الأداء المالي للفترة المختارة
          </p>
        </div>
        <FinanceDateRangePicker value={range} onChange={handleRangeChange} />
      </div>

      {/* ── KPI Row 1 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceKPICard
          title="الإيرادات"
          value={metrics?.revenue ?? 0}
          format="currency"
          icon={DollarSign}
          change={metrics?.revenueChange}
          description="إجمالي المدفوعات الناجحة"
        />
        <FinanceKPICard
          title="المبالغ المستحقة"
          value={metrics?.pending ?? 0}
          format="currency"
          icon={Clock}
          description={`${metrics?.pendingLateCount ?? 0} فاتورة متأخرة`}
        />
        <FinanceKPICard
          title="نسبة التحصيل"
          value={metrics?.collectionRate ?? 0}
          format="percent"
          icon={TrendingUp}
          description="نسبة الفواتير المحصلة من الإجمالي"
        />
        <FinanceKPICard
          title="صافي الربح"
          value={metrics?.netProfit ?? 0}
          format="currency"
          icon={Wallet}
          change={metrics?.netProfitChange}
          description="الإيرادات ناقص المصروفات"
        />
      </div>

      {/* ── KPI Row 2 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceKPICard
          title="المدفوعات الفاشلة"
          value={metrics?.failedPaymentsValue ?? 0}
          format="currency"
          icon={AlertTriangle}
          description={`${metrics?.failedPaymentsCount ?? 0} عملية فاشلة`}
        />
        <FinanceKPICard
          title="متوسط قيمة الفاتورة"
          value={metrics?.averageInvoice ?? 0}
          format="currency"
          icon={Receipt}
          description="متوسط قيمة الفواتير المصدرة"
        />
        <FinanceKPICard
          title="العملاء النشطون"
          value={metrics?.activeClients ?? 0}
          format="number"
          icon={Users}
          description="عدد العملاء ذوي الفواتير"
        />
        <FinanceKPICard
          title="إجمالي الرواتب"
          value={metrics?.salariesTotal ?? 0}
          format="currency"
          icon={CreditCard}
          change={metrics?.salariesChange}
          description="الرواتب المصروفة في الفترة"
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={trend || []} isLoading={trendLoading} />
        </div>
        <div className="lg:col-span-1">
          <PaymentMethodChart data={paymentMethods || []} isLoading={methodsLoading} />
        </div>
      </div>

      {/* ── Intelligence Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AgingChart data={aging || []} isLoading={agingLoading} />
        <ActionQueue actions={actions || []} isLoading={actionsLoading} />
        <TopClientsTable clients={topClients || []} isLoading={clientsLoading} />
      </div>

      {/* ── Bottom Row: Activity + Quick Links ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <span className="font-mono text-[10px] uppercase bg-neutral-100 px-2 py-0.5 rounded">
                    {log.entity}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-neutral-500">
                  {log.userId || "System"}
                </td>
                <td className="px-5 py-4 text-left text-xs text-neutral-400 font-mono">
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
              { value: metrics?.invoicesCount ?? 0, label: "مصدرة", accent: "neutral" },
              { value: metrics?.pendingLateCount ?? 0, label: "متأخرة", accent: metrics?.pendingLateCount > 0 ? "danger" : "neutral" },
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
                value: actions?.filter((a) => a.type === "PENDING_SALARY").length ?? 0,
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
                value: ledgerData?.items?.filter(
                  (l) => new Date(l.createdAt).toDateString() === new Date().toDateString(),
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
                  metrics?.collectionRate >= 80
                    ? "success"
                    : metrics?.collectionRate >= 50
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
