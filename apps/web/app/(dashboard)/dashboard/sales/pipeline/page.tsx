"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Kanban,
  DollarSign,
  Briefcase,
  TrendingUp,
  FileCheck,
  Search,
  CalendarDays,
} from "lucide-react";
import { SalesPipelineKanban } from "@/components/dashboard/sales/SalesPipelineKanban";
import { PageIntro } from "@/components/design-system/PageIntro";
import { ActionButton } from "@/components/design-system/ActionButton";
import { MetricCard } from "@/components/design-system/MetricCard";
import { Input } from "@/components/design-system/Input";
import { Select, SelectItem } from "@/components/design-system/Select";
import { FilterBar, type FilterGroup } from "@/components/design-system/FilterBar";
import { Skeleton } from "@/components/design-system/Skeleton";
import { useGetSalesMetricsQuery } from "@/features/sales/salesApi";

const PERIOD_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "last7days", label: "آخر 7 أيام" },
  { value: "last30days", label: "آخر 30 يوم" },
  { value: "lastYear", label: "آخر سنة" },
];

const STATUS_FILTER_GROUP: FilterGroup = {
  key: "status",
  label: "الحالة",
  options: [
    { value: "SUBMITTED", label: "طلب جديد" },
    { value: "QUALIFYING", label: "مراجعة المبيعات" },
    { value: "PROPOSAL_IN_PROGRESS", label: "إعداد العرض" },
    { value: "PROPOSAL_SENT", label: "تم إرسال العرض" },
    { value: "NEGOTIATION", label: "تفاوض" },
    { value: "CONTRACT_PREPARATION", label: "إعداد العقد" },
    { value: "CONTRACT_SENT", label: "العقد مرسل" },
    { value: "SIGNED", label: "تم التوقيع" },
    { value: "CANCELLED", label: "ملغي" },
  ],
};

export default function PipelinePage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const { data: metrics, isLoading: metricsLoading } = useGetSalesMetricsQuery(period === "all" ? undefined : period);

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (search.trim()) f.search = search.trim();
    const statuses = activeFilters.status;
    if (statuses?.length === 1) {
      f.status = statuses[0];
    }
    return f;
  }, [search, activeFilters]);

  const handleFilterChange = useCallback(
    (groupKey: string, values: string[]) => {
      setActiveFilters((prev) => ({ ...prev, [groupKey]: values }));
    },
    [],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="لوحة خط المبيعات"
        description="تتبّع حالة الطلبات من الاستقبال حتى التحويل إلى مشروع. اسحب البطاقات بين الأعمدة لتحديث الحالة."
        icon={Kanban}
        actions={
          <>
            <ActionButton
              variant="outline"
              size="md"
              href="/dashboard/sales/clients"
            >
              العملاء
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              href="/dashboard/sales/proposals"
            >
              العروض الفنية
            </ActionButton>
            <ActionButton
              variant="outline"
              size="md"
              href="/dashboard/sales/contracts"
            >
              العقود
            </ActionButton>
          </>
        }
      />

      {/* ── Metrics Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          <>
            <Skeleton className="h-[132px] rounded-[30px]" />
            <Skeleton className="h-[132px] rounded-[30px]" />
            <Skeleton className="h-[132px] rounded-[30px]" />
            <Skeleton className="h-[132px] rounded-[30px]" />
          </>
        ) : (
          <>
            <MetricCard
              title="قيمة الصفقات"
              amount={metrics?.pipelineValue ?? 0}
              icon={DollarSign}
            />
            <MetricCard
              title="الصفقات النشطة"
              value={metrics?.activeDeals ?? 0}
              icon={Briefcase}
            />
            <MetricCard
              title="نسبة التحويل"
              value={`${metrics?.closeRate ?? 0}%`}
              icon={TrendingUp}
              variant={metrics && metrics.closeRate > 20 ? "success" : metrics && metrics.closeRate > 10 ? "warning" : "default"}
            />
            <MetricCard
              title="الموقعة هذا الشهر"
              value={metrics?.signedThisMonth ?? 0}
              icon={FileCheck}
              variant={metrics && metrics.signedThisMonth > 0 ? "success" : "default"}
            />
          </>
        )}
      </div>

      {/* ── Search + Filter Toolbar ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="بحث باسم العميل أو الشركة..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <Select
          value={period}
          onValueChange={setPeriod}
          triggerClassName="w-[130px] h-10 rounded-xl border border-portal-card-border bg-natural-0 text-sm text-natural-100 font-medium"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.label} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </Select>
        <FilterBar
          groups={[STATUS_FILTER_GROUP]}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <SalesPipelineKanban filters={filters} />
    </div>
  );
}
