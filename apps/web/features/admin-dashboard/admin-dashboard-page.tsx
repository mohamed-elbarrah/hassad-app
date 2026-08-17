"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminAlertsQuery, useGetAdminAiInsightsQuery, useGetAdminDashboardAttentionQuery, useGetAdminDashboardRecentActivityQuery, useGetAdminDashboardTeamWorkloadQuery, useGetAdminFunnelQuery, useGetAdminStatsQuery, useGetAdminTrendsQuery } from "@/features/admin/adminApi";
import { buildTrendOptions, toPeriodParams, type PeriodKey, type TrendKey } from "@/features/admin-dashboard/dashboard-model";
import { ClientsPieCard, CrmFunnelCard, ExecutiveGrowthCard, ProjectsTrendCard, QuickActionsPanel, SupportPanels, TeamRadarCard } from "@/features/admin-dashboard/dashboard-panels";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-[32rem] rounded-3xl" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[34rem] rounded-3xl" />
        <Skeleton className="h-[34rem] rounded-3xl" />
        <Skeleton className="h-[34rem] rounded-3xl" />
        <Skeleton className="h-[34rem] rounded-3xl" />
      </div>
      <Skeleton className="h-[40rem] rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [selectedTrend, setSelectedTrend] = useState<TrendKey>("revenue");

  const periodParams = useMemo(() => toPeriodParams(period), [period]);

  const { data: stats, isLoading: statsLoading, isError: statsError } = useGetAdminStatsQuery();
  const { data: trends, isLoading: trendsLoading } = useGetAdminTrendsQuery(periodParams);
  const { data: alerts, isLoading: alertsLoading } = useGetAdminAlertsQuery();
  const { data: attention, isLoading: attentionLoading } = useGetAdminDashboardAttentionQuery();
  const { data: activity, isLoading: activityLoading } = useGetAdminDashboardRecentActivityQuery();
  const { data: workload, isLoading: workloadLoading } = useGetAdminDashboardTeamWorkloadQuery();
  const { data: aiInsights, isLoading: aiLoading } = useGetAdminAiInsightsQuery();
  const { data: funnel, isLoading: funnelLoading } = useGetAdminFunnelQuery(periodParams);

  const loading =
    statsLoading ||
    trendsLoading ||
    alertsLoading ||
    attentionLoading ||
    activityLoading ||
    workloadLoading ||
    aiLoading ||
    funnelLoading;

  const trendOptions = useMemo(() => buildTrendOptions(trends), [trends]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (statsError || !stats) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            لوحة الإدارة غير متاحة
          </CardTitle>
          <CardDescription>تعذر تحميل بيانات لوحة الإدارة التنفيذية.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ExecutiveGrowthCard
        period={period}
        onPeriodChange={setPeriod}
        selectedTrend={selectedTrend}
        onSelectTrend={(key) => setSelectedTrend(key as TrendKey)}
        labels={trends?.labels ?? []}
        trendOptions={trendOptions}
        stats={stats}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CrmFunnelCard funnel={funnel} />
        <ProjectsTrendCard trends={trends} stats={stats} />
        <TeamRadarCard stats={stats} workload={workload} />
        <ClientsPieCard stats={stats} alerts={alerts} attention={attention} />
      </div>

      <SupportPanels
        alerts={alerts}
        attention={attention}
        activity={activity ?? []}
        aiPending={aiInsights?.pendingSuggestions ?? 0}
        aiAnalyses={(aiInsights?.recentAnalyses ?? []).slice(0, 3)}
      />

      <QuickActionsPanel />
    </div>
  );
}
