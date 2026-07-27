"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Kanban,
  DollarSign,
  Briefcase,
  TrendingUp,
  FileCheck,
  Search,
  type LucideIcon,
} from "lucide-react";

import { SalesPipelineKanban } from "@/components/dashboard/sales/SalesPipelineKanban";
import { SalesFilterBar, type SalesFilterGroup } from "@/components/dashboard/sales/shared/SalesFilterBar";
import { SalesPageHeader } from "@/components/dashboard/sales/shared/SalesPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSalesMetricsQuery } from "@/features/sales/salesApi";

const PERIOD_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "last7days", label: "آخر 7 أيام" },
  { value: "last30days", label: "آخر 30 يوم" },
  { value: "lastYear", label: "آخر سنة" },
];

const STATUS_FILTER_GROUP: SalesFilterGroup = {
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
    <div className="page-shell" dir="rtl">
      <SalesPageHeader
        title="لوحة خط المبيعات"
        description="تتبّع حالة الطلبات من الاستقبال حتى التحويل إلى مشروع. اسحب البطاقات بين الأعمدة لتحديث الحالة."
        icon={Kanban}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/sales/clients">العملاء</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/sales/proposals">العروض الفنية</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/sales/contracts">العقود</Link>
            </Button>
          </>
        }
      />

      {/* ── Metrics Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricsLoading ? (
          <>
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </>
        ) : (
          <>
            <SalesMetricCard
              title="قيمة الصفقات"
              value={new Intl.NumberFormat("ar-SA-u-nu-latn").format(
                metrics?.pipelineValue ?? 0,
              )}
              suffix="ر.س"
              icon={DollarSign}
            />
            <SalesMetricCard
              title="الصفقات النشطة"
              value={metrics?.activeDeals ?? 0}
              icon={Briefcase}
            />
            <SalesMetricCard
              title="نسبة التحويل"
              value={`${metrics?.closeRate ?? 0}%`}
              icon={TrendingUp}
              tone={
                metrics && metrics.closeRate > 20
                  ? "success"
                  : metrics && metrics.closeRate > 10
                    ? "warning"
                    : "default"
              }
            />
            <SalesMetricCard
              title="الموقعة هذا الشهر"
              value={metrics?.signedThisMonth ?? 0}
              icon={FileCheck}
              tone={
                metrics && metrics.signedThisMonth > 0 ? "success" : "default"
              }
            />
          </>
        )}
      </div>

      {/* ── Search + Filter Toolbar ──────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث باسم العميل أو الشركة..."
            value={search}
            onChange={handleSearchChange}
            className="pr-10"
          />
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full rounded-xl lg:w-[130px]">
            <SelectValue placeholder="الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <SalesFilterBar
          groups={[STATUS_FILTER_GROUP]}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <SalesPipelineKanban filters={filters} />
    </div>
  );
}

function SalesMetricCard({
  title,
  value,
  icon: Icon,
  tone = "default",
  suffix,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning";
  suffix?: string;
}) {
  const toneClasses = {
    default: "bg-muted text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  };

  return (
    <Card className="rounded-3xl border-border-default shadow-none">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {suffix ? (
              <span className="text-sm font-medium text-muted-foreground">
                {suffix}
              </span>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl",
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent className="pt-0" />
    </Card>
  );
}
