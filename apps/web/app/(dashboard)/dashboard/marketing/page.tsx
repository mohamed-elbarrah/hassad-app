"use client";

import Link from "next/link";
import { Activity, AlertTriangle, ClipboardList, Megaphone, MousePointerClick, Target, Wallet, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { MarketingTaskWorkspace } from "@/components/dashboard/marketing/MarketingTaskWorkspace";
import { useGetMarketingOverviewQuery, useGetMyCampaignStatsQuery } from "@/features/marketing/marketingApi";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function MarketingDashboardPage() {
  const { data: overview, isLoading: tasksLoading } = useGetMarketingOverviewQuery({}, { pollingInterval: 30000 });
  const taskStats = overview?.summary;
  const { data: campaignStats, isLoading: campaignsLoading } = useGetMyCampaignStatsQuery(undefined, { pollingInterval: 30000 });
  const tasks = overview?.items ?? [];
  const conversions = tasks.reduce(
    (total, task) => total + (task.campaigns?.reduce((sum, campaign) => sum + (campaign.conversions ?? 0), 0) || 0),
    0,
  );
  const loading = tasksLoading || campaignsLoading;
  const metrics = [
    { label: "المهام النشطة", value: taskStats?.inProgress || 0, icon: Zap },
    { label: "الحملات النشطة", value: campaignStats?.activeCampaigns || 0, icon: Activity },
    { label: "إجمالي الإنفاق", value: formatCurrency(campaignStats?.totalBudgetUsed), icon: Wallet },
    { label: "متوسط ROAS", value: campaignStats?.avgRoas != null ? `${Number(campaignStats.avgRoas).toFixed(1)}x` : "-", icon: Target },
    { label: "التحويلات", value: formatNumber(conversions), icon: MousePointerClick },
    { label: "مهام متأخرة", value: taskStats?.overdue || 0, icon: AlertTriangle },
  ];

  if (loading) return <Loading />;
  return (
    <main dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="لوحة تحكم التسويق"
        description="ملخص أداء حملاتك ومهامك الحالية."
        icon={Megaphone}
        actions={<Button asChild variant="outline"><Link href="/dashboard/marketing/tasks"><ClipboardList /> عرض المهام المسندة</Link></Button>}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((item) => <Card key={item.label}><CardContent className="flex items-start justify-between gap-4 p-5"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="text-2xl font-semibold">{item.value}</p></div><div className="flex size-10 items-center justify-center rounded-lg bg-muted"><item.icon /></div></CardContent></Card>)}
      </section>
      <MarketingTaskWorkspace tasks={tasks} />
    </main>
  );
}

function Loading() {
  return <main className="flex flex-col gap-6" dir="rtl"><Skeleton className="h-20" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div><Skeleton className="h-96" /></main>;
}
