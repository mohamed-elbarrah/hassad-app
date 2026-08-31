"use client";

import { Building2, ClipboardCheck, DollarSign, FolderKanban, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { MetricCard } from "@/components/design-system/MetricCard";
import { ErrorState } from "@/components/design-system/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

import { useGetAdminOverviewQuery } from "@/features/admin/adminApi";
import { AdminCommercialFunnel } from "@/features/admin-dashboard/admin-commercial-funnel";
import { AdminInvoiceChart } from "@/features/admin-dashboard/admin-invoice-chart";
import { AdminProjectAmountChart } from "@/features/admin-dashboard/admin-project-amount-chart";
import { AdminOverviewTables } from "@/features/admin-dashboard/admin-overview-tables";
import { AdminSummaryChart } from "@/features/admin-dashboard/admin-summary-chart";
import { AdminOverviewFilters, getDefaultAdminOverviewFilters, type AdminOverviewFilters as AdminOverviewFilterValues } from "@/features/admin-dashboard/admin-overview-filters";
import { adminErrorMessage } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";

const kpiPresentation = {
  revenue: { title: "الإيرادات الشهرية", icon: DollarSign },
  activeClients: { title: "العملاء النشطون", icon: Users },
  activeProjects: { title: "المشاريع النشطة", icon: FolderKanban },
  overdueTasks: { title: "المهام المتأخرة", icon: ClipboardCheck },
} as const;

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-[380px] w-full rounded-card" />
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[380px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[420px] rounded-card" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState<AdminOverviewFilterValues>(getDefaultAdminOverviewFilters);
  const { data: overview, error, isLoading, isError, refetch } = useGetAdminOverviewQuery(filters);

  if (isLoading) return <PageSkeleton />;

  if (isError || !overview) {
    return (
      <ErrorState
        title="لوحة الإدارة غير متاحة"
        message={adminErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="نظرة عامة على الإدارة"
        description="ملخص تنفيذي لمتابعة الأداء التجاري والتشغيلي."
        icon={Building2}
        actions={<AdminOverviewFilters onChange={setFilters} />}
      />

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="مؤشرات الإدارة الرئيسية"
      >
        {overview.kpis.map((kpi) => {
          const presentation = kpiPresentation[kpi.key];
          const isRevenue = kpi.key === "revenue";
          const isOverdue = kpi.key === "overdueTasks";
          const trend = kpi.change == null
            ? undefined
            : isOverdue
              ? kpi.change < 0
                ? "up"
                : kpi.change > 0
                  ? "down"
                  : "neutral"
              : kpi.change > 0
                ? "up"
                : kpi.change < 0
                  ? "down"
                  : "neutral";

          return (
            <MetricCard
              key={kpi.key}
              title={presentation.title}
              value={isRevenue ? undefined : formatNumber(kpi.value)}
              amount={isRevenue ? kpi.value : undefined}
              icon={presentation.icon}
              variant={isOverdue && kpi.value > 0 ? "warning" : isRevenue ? "success" : "default"}
              trend={trend}
              trendValue={kpi.change == null ? undefined : `${kpi.change > 0 ? "+" : ""}${kpi.change}%`}
            />
          );
        })}
      </section>

      <AdminSummaryChart data={overview.commercialChart} />

      <section className="grid gap-6 lg:grid-cols-3" aria-label="تحليلات الإدارة">
        <AdminProjectAmountChart data={overview.projectAmountChart} />
        <AdminInvoiceChart data={overview.invoiceChart} />
        <AdminCommercialFunnel data={overview.funnel} />
      </section>

      <AdminOverviewTables
        leadOrders={overview.leadOrders}
        salesLeaders={overview.salesLeaders}
        activeProjects={overview.activeProjects}
        clients={overview.clients}
      />
    </div>
  );
}
