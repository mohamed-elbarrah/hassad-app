"use client";

import { useState, useMemo } from "react";
import { LayoutDashboard, AlertTriangle } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { AdminEmptyState } from "@/components/dashboard/admin/shared/AdminEmptyState";
import { Skeleton } from "@/components/design-system/Skeleton";
import { periodToDateRange } from "@/components/dashboard/admin/overview/MiniPeriodFilter";
import type { PeriodKey } from "@/components/dashboard/admin/overview/MiniPeriodFilter";
import {
  KpiGrid,
  buildAdminKpiConfigs,
} from "@/components/dashboard/admin/overview/KpiGrid";
import { AlertPanel } from "@/components/dashboard/admin/overview/AlertPanel";
import type { AlertCategory } from "@/components/dashboard/admin/overview/AlertPanel";
import { TrendChart } from "@/components/dashboard/admin/overview/TrendChart";
import type { TrendMetricOption } from "@/components/dashboard/admin/overview/TrendChart";
import { FunnelChart } from "@/components/dashboard/admin/overview/FunnelChart";
import type { FunnelStage } from "@/components/dashboard/admin/overview/FunnelChart";
import { ContractChart } from "@/components/dashboard/admin/overview/ContractChart";
import type { ConversionStep } from "@/components/dashboard/admin/overview/ContractChart";
import { HealthScore } from "@/components/dashboard/admin/overview/HealthScore";
import { ActivityFeed } from "@/components/dashboard/admin/overview/ActivityFeed";

import { QuickActions } from "@/components/dashboard/admin/overview/QuickActions";
import { AiInsightsCard } from "@/components/dashboard/admin/overview/AiInsightsCard";
import {
  useGetAdminStatsQuery,
  useGetAdminTrendsQuery,
  useGetAdminAlertsQuery,
  useGetAdminDashboardAttentionQuery,
  useGetAdminDashboardRecentActivityQuery,
  useGetAdminFunnelQuery,
  useGetAdminHealthQuery,
} from "@/features/admin/adminApi";
import type {
  AdminAlertsResponse,
  AdminAttentionResponse,
} from "@/features/admin/adminApi";

function buildAlertCategories(
  alerts: AdminAlertsResponse | undefined,
  attention: AdminAttentionResponse | undefined,
): AlertCategory[] {
  const categories: AlertCategory[] = [];

  if (alerts) {
    if (alerts.overdueTasks.count > 0) {
      categories.push({
        key: "overdueTasks",
        label: alerts.overdueTasks.label,
        count: alerts.overdueTasks.count,
        severity: "HIGH",
        href: "/dashboard/admin/tasks",
        items: alerts.overdueTasks.items.map((i) => ({
          id: i.id,
          title: i.title,
          subtitle: i.assignee ? `مسند إلى ${i.assignee}` : undefined,
        })),
      });
    }
    if (alerts.agedInvoices.count > 0) {
      categories.push({
        key: "agedInvoices",
        label: alerts.agedInvoices.label,
        count: alerts.agedInvoices.count,
        severity: "HIGH",
        href: "/dashboard/admin/finance",
        items: alerts.agedInvoices.items.map((i) => ({
          id: i.id,
          title: `فاتورة ${i.invoiceNumber}`,
          subtitle: i.clientName ?? undefined,
        })),
      });
    }
    if (alerts.escalatedDisputes.count > 0) {
      categories.push({
        key: "escalatedDisputes",
        label: alerts.escalatedDisputes.label,
        count: alerts.escalatedDisputes.count,
        severity: "HIGH",
        href: "/dashboard/admin/disputes",
        items: alerts.escalatedDisputes.items.map((i) => ({
          id: i.id,
          title: i.title,
          subtitle: `#${i.ticketNumber}`,
        })),
      });
    }
    if (alerts.expiringContracts.count > 0) {
      categories.push({
        key: "expiringContracts",
        label: alerts.expiringContracts.label,
        count: alerts.expiringContracts.count,
        severity: "MEDIUM",
        href: "/dashboard/admin/contracts",
        items: alerts.expiringContracts.items.map((i) => ({
          id: i.id,
          title: i.title,
          subtitle: i.clientName ?? undefined,
        })),
      });
    }
    if (alerts.pendingRequests.count > 0) {
      categories.push({
        key: "pendingRequests",
        label: alerts.pendingRequests.label,
        count: alerts.pendingRequests.count,
        severity: "MEDIUM",
        href: "/dashboard/admin/requests",
        items: alerts.pendingRequests.items.map((i) => ({
          id: i.id,
          title: i.companyName,
          subtitle: i.contactName,
        })),
      });
    }
    if (alerts.failedWebhooks.count > 0) {
      categories.push({
        key: "failedWebhooks",
        label: alerts.failedWebhooks.label,
        count: alerts.failedWebhooks.count,
        severity: "LOW",
        href: "/dashboard/admin/integrations",
        items: [],
      });
    }
  }

  if (attention) {
    if (attention.stalledProjects.length > 0) {
      categories.push({
        key: "stalledProjects",
        label: "مشاريع متعطلة",
        count: attention.stalledProjects.length,
        severity: "LOW",
        href: "/dashboard/admin/projects",
        items: attention.stalledProjects.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: p.client.companyName,
          href: `/dashboard/admin/projects/${p.id}`,
        })),
      });
    }
  }

  return categories;
}

export default function AdminOverviewPage() {
  // Shared period state — all 3 filters control the same value
  const [period, setPeriod] = useState<PeriodKey>("thisMonth");
  const trendDateRange = useMemo(() => periodToDateRange(period), [period]);
  const funnelDateRange = useMemo(() => periodToDateRange(period), [period]);

  // Stats — no date filter (defaults to trailing 30 days server-side)
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useGetAdminStatsQuery();
  const { data: alerts } = useGetAdminAlertsQuery();
  const { data: attention } = useGetAdminDashboardAttentionQuery();
  const { data: recentActivity } = useGetAdminDashboardRecentActivityQuery();
  const { data: health } = useGetAdminHealthQuery();

  // Trends — has own period filter
  const { data: trends } = useGetAdminTrendsQuery(trendDateRange);

  // Funnel — has own period filter (ContractChart shares this data)
  const { data: funnel } = useGetAdminFunnelQuery(funnelDateRange);

  const kpiConfigs = useMemo(
    () => buildAdminKpiConfigs(stats, trends),
    [stats, trends],
  );

  const alertCategories = useMemo(
    () => buildAlertCategories(alerts, attention),
    [alerts, attention],
  );

  const trendMetrics = useMemo((): TrendMetricOption[] => {
    if (!trends) return [];
    return [
      {
        key: "revenue",
        label: "الإيرادات",
        data: trends.revenue,
        color: "#10B981",
        format: "currency",
      },
      {
        key: "newUsers",
        label: "المستخدمون",
        data: trends.newUsers,
        color: "#121936",
      },
      {
        key: "newClients",
        label: "العملاء",
        data: trends.newClients,
        color: "#6366F1",
      },
      {
        key: "newProjects",
        label: "المشاريع",
        data: trends.newProjects,
        color: "#E7BE52",
      },
    ];
  }, [trends]);

  const funnelStages = useMemo((): FunnelStage[] => {
    if (!funnel) return [];
    return [
      { label: "العملاء المتوقعون", value: funnel.leads, color: "#E7BE52" },
      { label: "العملاء المؤهلون", value: funnel.clients, color: "#6366F1" },
      { label: "العروض", value: funnel.proposals, color: "#121936" },
      { label: "العقود", value: funnel.contracts, color: "#10B981" },
    ];
  }, [funnel]);

  const contractSteps = useMemo((): ConversionStep[] => {
    if (!funnel) return [];
    return [
      {
        label: "العروض ← العقود",
        from: funnel.proposals,
        to: funnel.contracts,
        rate: funnel.conversionRates.proposalsToContracts,
        color: "#121936",
      },
      {
        label: "العقود ← المشاريع",
        from: funnel.contracts,
        to: funnel.projects,
        rate: funnel.conversionRates.contractsToProjects,
        color: "#6366F1",
      },
      {
        label: "المشاريع ← الفواتير",
        from: funnel.projects,
        to: funnel.invoices,
        rate: funnel.conversionRates.projectsToInvoices,
        color: "#E7BE52",
      },
      {
        label: "الفواتير ← المدفوعات",
        from: funnel.invoices,
        to: funnel.payments,
        rate: funnel.conversionRates.invoicesToPayments,
        color: "#10B981",
      },
    ];
  }, [funnel]);

  if (statsLoading) {
    return (
      <div className="page-shell" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[30px]" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-[30px]" />
        <Skeleton className="h-48 rounded-[30px]" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="page-shell" dir="rtl">
        <PageIntro title="لوحة التحكم" icon={LayoutDashboard} />
        <AdminEmptyState
          icon={AlertTriangle}
          title="تعذر تحميل البيانات"
          description="حدث خطأ أثناء تحميل إحصائيات لوحة التحكم. يرجى تحديث الصفحة والمحاولة مرة أخرى."
        />
      </div>
    );
  }

  return (
    <div className="page-shell" dir="rtl">
      {/* Row 1 — Header */}
      <PageIntro
        title="لوحة التحكم"
        description="نظرة عامة على أداء المنصة والمؤشرات الرئيسية"
        icon={LayoutDashboard}
      />

      {/* Row 2 — KPI Cards (defaults to trailing 30 days) */}
      <KpiGrid items={kpiConfigs} />

      {/* Row 3 — Alerts + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <AlertPanel categories={alertCategories} />
        </div>
        <div className="lg:col-span-3">
          <TrendChart
            labels={trends?.labels ?? []}
            metrics={trendMetrics}
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>
      </div>

      {/* Row 4 — Funnel + Contract Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart
          stages={funnelStages}
          conversionRate={funnel?.conversionRates?.leadsToClients ?? 0}
          period={period}
          onPeriodChange={setPeriod}
        />
        <ContractChart
          steps={contractSteps}
          period={period}
          onPeriodChange={setPeriod}
        />
      </div>

      {/* Row 5 — Health + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <HealthScore
            overallScore={health?.overallScore ?? 0}
            database={health?.database ?? "connected"}
            servicesHealthy={
              health?.services?.filter((s) => s.status === "healthy").length ??
              0
            }
            servicesTotal={health?.services?.length ?? 0}
            recentErrors={health?.recentErrors ?? 0}
            activeUsersLastHour={health?.activeUsersLastHour ?? 0}
            unresolvedErrors={health?.unresolvedErrors ?? 0}
            retentionRate={stats?.retentionRate ?? 0}
            churnRate={stats?.churnRate ?? 0}
          />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed
            items={(recentActivity ?? []).map((a) => ({
              id: a.id,
              actorName: a.userName,
              action: a.action,
              entityType: a.entity,
              createdAt: a.createdAt,
            }))}
          />
        </div>
      </div>

      {/* Row 6 — Quick Actions + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <AiInsightsCard />
      </div>
    </div>
  );
}
