"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  DollarSign,
  FolderKanban,
  Users,
  Star,
  Megaphone,
  TrendingUp,
  Minus,
  RefreshCw,
  AlertCircle,
  Target,
  Percent,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  MousePointerClick,
  Wallet,
  UserCheck,
  UserX,
  Hourglass,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { EmptyState } from "@/components/design-system/EmptyState";
import { GaugeChart } from "@/components/design-system/GaugeChart";
import { MonthlyComparisonBarChart } from "@/components/design-system/MonthlyComparisonBarChart";
import { SpendDistributionDonutChart } from "@/components/design-system/SpendDistributionDonutChart";
import { Skeleton } from "@/components/design-system/Skeleton";
import { DataTable } from "@/components/design-system/DataTable";
import type { DataTableColumn } from "@/components/design-system/DataTable";
import { TimeRangeSelector, getTimeRangeParams } from "@/components/design-system/TimeRangeSelector";
import type { TimeRange } from "@/components/design-system/TimeRangeSelector";
import {
  useGetAdminReportSalesQuery,
  useGetAdminReportRevenueQuery,
  useGetAdminReportProjectsQuery,
  useGetAdminReportTeamPerformanceQuery,
  useGetAdminReportSatisfactionQuery,
  useGetAdminReportCampaignsQuery,
} from "@/features/admin/adminApi";
import { formatCurrency, formatNumber, formatShortDateLong, formatRelativeTime } from "@/lib/format";

const REPORT_TABS = [
  { value: "sales", label: "المبيعات", icon: TrendingUp },
  { value: "revenue", label: "الإيرادات", icon: DollarSign },
  { value: "projects", label: "المشاريع", icon: FolderKanban },
  { value: "team", label: "أداء الفريق", icon: Users },
  { value: "satisfaction", label: "رضا العملاء", icon: Star },
  { value: "campaigns", label: "الحملات", icon: Megaphone },
];

function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-[1.5px] border-danger-200 bg-danger-100 px-5 py-10 text-center">
      <AlertCircle className="h-10 w-10 text-danger-600" />
      <div>
        <p className="text-base font-medium text-danger-700">
          {message ?? "حدث خطأ أثناء تحميل البيانات"}
        </p>
        <p className="mt-1 text-sm text-danger-600">يرجى المحاولة لاحقاً</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-danger-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-700"
      >
        <RefreshCw className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [timeRange, setTimeRange] = useState<TimeRange>("last30days");

  const rangeParams = useMemo(() => getTimeRangeParams(timeRange), [timeRange]);
  const qParams = useMemo(
    () => ({ from: rangeParams.dateFrom, to: rangeParams.dateTo }),
    [rangeParams],
  );

  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
    refetch: salesRefetch,
  } = useGetAdminReportSalesQuery(qParams);
  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
    refetch: revenueRefetch,
  } = useGetAdminReportRevenueQuery(qParams);
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: projectsRefetch,
  } = useGetAdminReportProjectsQuery(qParams);
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
    refetch: teamRefetch,
  } = useGetAdminReportTeamPerformanceQuery(qParams);
  const {
    data: satisfactionData,
    isLoading: satisfactionLoading,
    error: satisfactionError,
    refetch: satisfactionRefetch,
  } = useGetAdminReportSatisfactionQuery(qParams);
  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    error: campaignsError,
    refetch: campaignsRefetch,
  } = useGetAdminReportCampaignsQuery(qParams);

  const salesColumns: DataTableColumn[] = [
    { id: "source", label: "المصدر" },
    { id: "count", label: "عدد العملاء", align: "center" },
    { id: "deals", label: "قيمة الصفقات", align: "left" },
    { id: "rate", label: "معدل التحويل", align: "center" },
  ];

  const revenueColumns: DataTableColumn[] = [
    { id: "rank", label: "#", width: "40px", align: "center" },
    { id: "client", label: "العميل" },
    { id: "revenue", label: "الإيرادات", align: "left" },
    { id: "invoices", label: "الفواتير", align: "center" },
    { id: "paid", label: "المدفوع", align: "left" },
  ];

  const projectsColumns: DataTableColumn[] = [
    { id: "name", label: "المشروع" },
    { id: "status", label: "الحالة", align: "center" },
    { id: "progress", label: "نسبة الإنجاز", align: "center" },
    { id: "duration", label: "المدة (أيام)", align: "center" },
    { id: "deadline", label: "تاريخ التسليم", align: "center" },
  ];

  const teamColumns: DataTableColumn[] = [
    { id: "name", label: "العضو" },
    { id: "completed", label: "المهام المكتملة", align: "center" },
    { id: "inProgress", label: "قيد التنفيذ", align: "center" },
    { id: "rate", label: "نسبة الإنجاز", align: "center" },
    { id: "avgTime", label: "متوسط الوقت", align: "center" },
  ];

  const satisfactionColumns: DataTableColumn[] = [
    { id: "client", label: "العميل" },
    { id: "score", label: "التقييم", align: "center" },
    { id: "comment", label: "التعليق" },
    { id: "date", label: "التاريخ", align: "center" },
  ];

  const campaignColumns: DataTableColumn[] = [
    { id: "name", label: "الحملة" },
    { id: "platform", label: "المنصة", align: "center" },
    { id: "spend", label: "الإنفاق", align: "left" },
    { id: "impressions", label: "مرات الظهور", align: "center" },
    { id: "clicks", label: "النقرات", align: "center" },
    { id: "conversions", label: "التحويلات", align: "center" },
    { id: "roi", label: "ROI", align: "center" },
  ];

  const revenueTimeline = useMemo(() => {
    if (!revenueData?.monthlyTrend?.length) return undefined;
    const trend = revenueData.monthlyTrend as any[];
    return {
      labels: trend.map((m: any) => m.month ?? m.label),
      datasets: [
        { label: "الإيرادات", metric: "revenue", data: trend.map((m: any) => m.revenue ?? m.value ?? 0) },
      ],
    };
  }, [revenueData]);

  const paidTimeline = useMemo(() => {
    if (!revenueData?.monthlyTrend?.length) return undefined;
    const trend = revenueData.monthlyTrend as any[];
    return {
      labels: trend.map((m: any) => m.month ?? m.label),
      datasets: [
        { label: "مدفوع", metric: "paid", data: trend.map((m: any) => m.paid ?? m.paidRevenue ?? 0) },
      ],
    };
  }, [revenueData]);

  const unpaidTimeline = useMemo(() => {
    if (!revenueData?.monthlyTrend?.length) return undefined;
    const trend = revenueData.monthlyTrend as any[];
    return {
      labels: trend.map((m: any) => m.month ?? m.label),
      datasets: [
        { label: "غير مدفوع", metric: "unpaid", data: trend.map((m: any) => m.unpaid ?? m.unpaidRevenue ?? 0) },
      ],
    };
  }, [revenueData]);

  const platformDistribution = useMemo(() => {
    if (!campaignsData?.byPlatform?.length) return [];
    const platforms = campaignsData.byPlatform as any[];
    const total = platforms.reduce((sum: number, p: any) => sum + (p.spent ?? 0), 0);
    return platforms.map((p: any) => ({
      platform: p.platform ?? p.name,
      spend: p.spent ?? 0,
      percent: total > 0 ? ((p.spent ?? 0) / total) * 100 : 0,
    }));
  }, [campaignsData]);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="التقارير والإحصائيات"
        description="نظرة شاملة على أداء المنصة"
        icon={BarChart3}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="w-full overflow-x-auto sm:w-auto">
            {REPORT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        {/* ── Sales Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="sales" className="mt-4 space-y-6">
          {salesLoading && !salesData ? (
            <>
              <StatSkeleton count={4} />
              <ContentSkeleton />
            </>
          ) : salesError && !salesData ? (
            <ErrorBanner onRetry={salesRefetch} />
          ) : !salesData ? (
            <EmptyState
              icon={TrendingUp}
              title="لا توجد بيانات مبيعات"
              hint="لم يتم تسجيل أي بيانات مبيعات بعد"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="إجمالي العملاء المحتملين" value={formatNumber(salesData.totalLeads)} icon={Target} />
                <StatCard title="معدل التحويل" value={salesData.conversionRate != null ? `${salesData.conversionRate}%` : "—"} icon={Percent} variant="success" />
                <StatCard title="قيمة الصفقات" value={formatCurrency(salesData.totalDealValue)} icon={DollarSign} />
                <StatCard title="متوسط الصفقة" value={formatCurrency(salesData.avgDealValue)} icon={TrendingUp} />
              </div>

              {salesData.byStage?.length > 0 && (
                <SurfaceCard title="العملاء حسب المرحلة">
                  <div className="space-y-3">
                    {(salesData.byStage as any[]).map((stage: any) => (
                      <div key={stage.stage ?? stage.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-natural-100">{stage.stage ?? stage.name}</span>
                          <span className="font-medium">{stage.count ?? stage.value}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-secondary-500"
                            style={{ width: `${stage.percentage ?? ((stage.count ?? 0) / (salesData.totalLeads || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              )}

              {salesData.bySource?.length > 0 && (
                <SurfaceCard title="العملاء حسب المصدر">
                  <DataTable
                    columns={salesColumns}
                    data={salesData.bySource as any[]}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: TrendingUp,
                      message: "لا توجد مصادر",
                      hint: "",
                    }}
                    renderCells={(row: any) => [
                      <td key="source" className="px-5 py-4 text-sm font-medium text-natural-100">{row.source ?? row.name}</td>,
                      <td key="count" className="px-5 py-4 text-sm text-center">{formatNumber(row.count ?? row.value)}</td>,
                      <td key="deals" className="px-5 py-4 text-sm text-end">{formatCurrency(row.revenue ?? row.dealValue)}</td>,
                      <td key="rate" className="px-5 py-4 text-sm text-center">
                        {row.conversionRate != null ? `${row.conversionRate}%` : "—"}
                      </td>,
                    ]}
                  />
                </SurfaceCard>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Revenue Tab ────────────────────────────────────────────────── */}
        <TabsContent value="revenue" className="mt-4 space-y-6">
          {revenueLoading && !revenueData ? (
            <>
              <StatSkeleton count={4} />
              <ContentSkeleton />
            </>
          ) : revenueError && !revenueData ? (
            <ErrorBanner onRetry={revenueRefetch} />
          ) : !revenueData ? (
            <EmptyState
              icon={DollarSign}
              title="لا توجد بيانات إيرادات"
              hint="لم يتم تسجيل أي إيرادات بعد"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="إجمالي الإيرادات" value={formatCurrency(revenueData.totalRevenue)} icon={DollarSign} />
                <StatCard title="الفواتير المدفوعة" value={formatCurrency(revenueData.paidRevenue)} icon={CheckCircle2} variant="success" />
                <StatCard title="الفواتير المعلقة" value={formatCurrency(revenueData.unpaidRevenue)} icon={Hourglass} variant="danger" />
                <StatCard title="متوسط الفاتورة" value={formatCurrency(revenueData.avgInvoiceValue)} icon={Wallet} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(revenueTimeline || paidTimeline) && (
                  <SurfaceCard title="الاتجاه الشهري للإيرادات" className="h-72">
                    <div className="h-64">
                      <MonthlyComparisonBarChart timeline={revenueTimeline} />
                    </div>
                  </SurfaceCard>
                )}
                {paidTimeline && (
                  <SurfaceCard title="المدفوع مقابل غير المدفوع" className="h-72">
                    <div className="grid grid-cols-2 gap-4 h-64">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-natural-100 mb-2 text-center">مدفوع</p>
                        <div className="flex-1">
                          <MonthlyComparisonBarChart timeline={paidTimeline} />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-natural-100 mb-2 text-center">غير مدفوع</p>
                        <div className="flex-1">
                          <MonthlyComparisonBarChart timeline={unpaidTimeline} />
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                )}
              </div>

              {revenueData.topClients?.length > 0 && (
                <SurfaceCard title="أفضل العملاء من حيث الإيرادات">
                  <DataTable
                    columns={revenueColumns}
                    data={(revenueData.topClients as any[]).slice(0, 10)}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: DollarSign,
                      message: "لا يوجد عملاء",
                      hint: "",
                    }}
                    renderCells={(row: any, { onActivate }) => {
                      const idx = (revenueData.topClients as any[]).indexOf(row);
                      return [
                        <td key="rank" className="px-5 py-4 text-sm text-center text-portal-note-text">{idx + 1}</td>,
                        <td key="client" className="px-5 py-4 text-sm font-medium text-natural-100">{row.name ?? row.companyName}</td>,
                        <td key="revenue" className="px-5 py-4 text-sm text-end">{formatCurrency(row.revenue ?? row.totalRevenue)}</td>,
                        <td key="invoices" className="px-5 py-4 text-sm text-center">{formatNumber(row.invoiceCount ?? row.totalInvoices)}</td>,
                        <td key="paid" className="px-5 py-4 text-sm text-end">{formatCurrency(row.paidAmount ?? row.paidRevenue)}</td>,
                      ];
                    }}
                  />
                </SurfaceCard>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Projects Tab ───────────────────────────────────────────────── */}
        <TabsContent value="projects" className="mt-4 space-y-6">
          {projectsLoading && !projectsData ? (
            <>
              <StatSkeleton count={4} />
              <ContentSkeleton />
            </>
          ) : projectsError && !projectsData ? (
            <ErrorBanner onRetry={projectsRefetch} />
          ) : !projectsData ? (
            <EmptyState
              icon={FolderKanban}
              title="لا توجد بيانات مشاريع"
              hint="لم يتم إنشاء أي مشاريع بعد"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="مكتملة" value={formatNumber(projectsData.completedProjects)} icon={CheckCircle2} variant="success" />
                <StatCard title="قيد التنفيذ" value={formatNumber(projectsData.activeProjects)} icon={FolderKanban} variant="success" />
                <StatCard title="متأخرة" value={formatNumber(projectsData.overdueProjects)} icon={AlertTriangle} variant="danger" />
                <StatCard title="متوسط المدة (أيام)" value={projectsData.avgDuration != null ? formatNumber(projectsData.avgDuration) : "—"} icon={Clock} />
              </div>

              {projectsData.byStatus?.length > 0 && (
                <SurfaceCard title="المشاريع حسب الحالة">
                  <div className="space-y-3">
                    {(projectsData.byStatus as any[]).map((item: any) => (
                      <div key={item.status ?? item.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-natural-100">
                            <StatusBadge status={item.status ?? item.name} />
                          </span>
                          <span className="font-medium">{item.count ?? item.value}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${item.percentage ?? ((item.count ?? 0) / (projectsData.totalProjects || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              )}

              {projectsData.projects?.length > 0 && (
                <SurfaceCard title="قائمة المشاريع">
                  <DataTable
                    columns={projectsColumns}
                    data={projectsData.projects as any[]}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: FolderKanban,
                      message: "لا توجد مشاريع",
                      hint: "",
                    }}
                    renderCells={(row: any) => [
                      <td key="name" className="px-5 py-4 text-sm font-medium text-natural-100">{row.name ?? row.title}</td>,
                      <td key="status" className="px-5 py-4 text-sm text-center"><StatusBadge status={row.status} /></td>,
                      <td key="progress" className="px-5 py-4 text-sm text-center">{row.completionRate != null ? `${row.completionRate}%` : "—"}</td>,
                      <td key="duration" className="px-5 py-4 text-sm text-center">{row.duration ?? row.avgDuration ?? "—"}</td>,
                      <td key="deadline" className="px-5 py-4 text-sm text-center">{row.deadline ? formatShortDateLong(row.deadline) : "—"}</td>,
                    ]}
                  />
                </SurfaceCard>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Team Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="team" className="mt-4 space-y-6">
          {teamLoading && !teamData ? (
            <>
              <StatSkeleton count={4} />
              <ContentSkeleton />
            </>
          ) : teamError && !teamData ? (
            <ErrorBanner onRetry={teamRefetch} />
          ) : !teamData ? (
            <EmptyState
              icon={Users}
              title="لا توجد بيانات أداء الفريق"
              hint="لم يتم تسجيل بيانات أداء الفريق بعد"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="إجمالي المهام" value={formatNumber(teamData.totalTasks)} icon={Target} />
                <StatCard title="مكتملة" value={formatNumber(teamData.completedTasks)} icon={CheckCircle2} variant="success" />
                <StatCard title="متوسط وقت التسليم" value={teamData.avgDeliveryTime ? `${teamData.avgDeliveryTime} ساعة` : "—"} icon={Clock} />
                <StatCard title="معدل الإرجاع" value={teamData.reworkRate != null ? `${teamData.reworkRate}%` : "—"} icon={AlertTriangle} variant={teamData.reworkRate > 20 ? "danger" : "success"} />
              </div>

              {teamData.members?.length > 0 && (
                <SurfaceCard title="أداء أعضاء الفريق">
                  <DataTable
                    columns={teamColumns}
                    data={teamData.members as any[]}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: Users,
                      message: "لا يوجد أعضاء",
                      hint: "",
                    }}
                    renderCells={(row: any) => [
                      <td key="name" className="px-5 py-4 text-sm font-medium text-natural-100">{row.name ?? row.userName}</td>,
                      <td key="completed" className="px-5 py-4 text-sm text-center">{formatNumber(row.completedTasks ?? row.completed)}</td>,
                      <td key="inProgress" className="px-5 py-4 text-sm text-center">{formatNumber(row.inProgressTasks ?? row.inProgress)}</td>,
                      <td key="rate" className="px-5 py-4 text-sm text-center">
                        {row.completionRate != null ? `${row.completionRate}%` : "—"}
                      </td>,
                      <td key="avgTime" className="px-5 py-4 text-sm text-center">
                        {row.avgTaskTime ? `${row.avgTaskTime} س` : "—"}
                      </td>,
                    ]}
                  />
                </SurfaceCard>
              )}

              {(!teamData.members || teamData.members.length === 0) && teamData.totalMembers > 0 && (
                <p className="text-center text-sm text-portal-note-text py-8">
                  لا توجد بيانات أداء تفصيلية للأعضاء
                </p>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Satisfaction Tab ───────────────────────────────────────────── */}
        <TabsContent value="satisfaction" className="mt-4 space-y-6">
          {satisfactionLoading && !satisfactionData ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <ContentSkeleton />
            </>
          ) : satisfactionError && !satisfactionData ? (
            <ErrorBanner onRetry={satisfactionRefetch} />
          ) : !satisfactionData ? (
            <EmptyState
              icon={Star}
              title="لا توجد بيانات رضا العملاء"
              hint="لم يتم تسجيل أي تقييمات بعد"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SurfaceCard title="متوسط التقييم" className="flex flex-col items-center justify-center">
                  <GaugeChart
                    value={satisfactionData.avgScore != null ? Math.round((satisfactionData.avgScore / 5) * 100) : 0}
                  />
                  <p className="text-sm text-portal-note-text text-center mt-1">
                    {satisfactionData.avgScore != null ? `${satisfactionData.avgScore} / 5` : "—"}
                  </p>
                </SurfaceCard>
                <StatCard title="إجمالي التقييمات" value={formatNumber(satisfactionData.totalRatings)} icon={Star} />
                <StatCard title="تقييمات منخفضة (&lt; 3)" value={formatNumber(satisfactionData.lowRatings)} icon={ThumbsDown} variant="danger" />
                <StatCard title="اتجاه الرضا" value={satisfactionData.satisfactionTrend != null ? `${satisfactionData.satisfactionTrend > 0 ? "+" : ""}${satisfactionData.satisfactionTrend}%` : "—"} icon={TrendingUp} variant={satisfactionData.satisfactionTrend > 0 ? "success" : satisfactionData.satisfactionTrend < 0 ? "danger" : undefined} />
              </div>

              {satisfactionData.distribution?.length > 0 && (
                <SurfaceCard title="توزيع التقييمات">
                  <div className="space-y-3">
                    {([5, 4, 3, 2, 1] as const).map((score) => {
                      const item = (satisfactionData.distribution as any[]).find(
                        (d: any) => Number(d.score ?? d.rating) === score,
                      );
                      const count = item?.count ?? 0;
                      const total = satisfactionData.totalRatings ?? 1;
                      const pct = (count / total) * 100;
                      const barColors: Record<number, string> = {
                        5: "bg-green-500",
                        4: "bg-blue-500",
                        3: "bg-yellow-500",
                        2: "bg-orange-500",
                        1: "bg-red-500",
                      };
                      return (
                        <div key={score} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-8">{score} ★</span>
                          <div className="flex-1 h-3 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColors[score]}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-portal-note-text w-10 text-left">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </SurfaceCard>
              )}

              {satisfactionData.recentRatings?.length > 0 && (
                <SurfaceCard title="آخر التقييمات">
                  <DataTable
                    columns={satisfactionColumns}
                    data={satisfactionData.recentRatings as any[]}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: Star,
                      message: "لا توجد تقييمات",
                      hint: "",
                    }}
                    renderCells={(row: any) => [
                      <td key="client" className="px-5 py-4 text-sm font-medium text-natural-100">{row.clientName ?? row.name ?? "—"}</td>,
                      <td key="score" className="px-5 py-4 text-sm text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          {row.score ?? row.rating ?? "—"} ★
                        </span>
                      </td>,
                      <td key="comment" className="px-5 py-4 text-sm text-portal-note-text max-w-xs truncate">{row.comment ?? row.feedback ?? "—"}</td>,
                      <td key="date" className="px-5 py-4 text-sm text-center text-portal-note-text">
                        {row.createdAt ? formatRelativeTime(row.createdAt) : "—"}
                      </td>,
                    ]}
                  />
                </SurfaceCard>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Campaigns Tab ──────────────────────────────────────────────── */}
        <TabsContent value="campaigns" className="mt-4 space-y-6">
          {campaignsLoading && !campaignsData ? (
            <>
              <StatSkeleton count={4} />
              <ContentSkeleton />
            </>
          ) : campaignsError && !campaignsData ? (
            <ErrorBanner onRetry={campaignsRefetch} />
          ) : !campaignsData ? (
            <EmptyState
              icon={Megaphone}
              title="لا توجد بيانات حملات"
              hint="لم يتم إنشاء أي حملات بعد"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="إجمالي الحملات" value={formatNumber(campaignsData.totalCampaigns)} icon={Megaphone} />
                <StatCard title="إجمالي الإنفاق" value={formatCurrency(campaignsData.totalSpent)} icon={Wallet} variant="warning" />
                <StatCard title="إجمالي التحويلات" value={formatNumber(campaignsData.totalConversions)} icon={MousePointerClick} />
                <StatCard title="متوسط ROI" value={campaignsData.avgRoi != null ? `${campaignsData.avgRoi}%` : "—"} icon={TrendingUp} variant="success" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {platformDistribution.length > 0 && (
                  <SurfaceCard title="توزيع الإنفاق حسب المنصة">
                    <SpendDistributionDonutChart data={platformDistribution} />
                  </SurfaceCard>
                )}
                {campaignsData.byStatus?.length > 0 && (
                  <SurfaceCard title="الحملات حسب الحالة">
                    <div className="flex flex-wrap gap-3 p-4">
                      {(campaignsData.byStatus as any[]).map((item: any) => (
                        <div key={item.status ?? item.name} className="flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-3">
                          <StatusBadge status={item.status ?? item.name} />
                          <span className="text-sm font-medium">{item.count ?? item.value}</span>
                        </div>
                      ))}
                    </div>
                  </SurfaceCard>
                )}
              </div>

              {campaignsData.campaigns?.length > 0 && (
                <SurfaceCard title="قائمة الحملات">
                  <DataTable
                    columns={campaignColumns}
                    data={campaignsData.campaigns as any[]}
                    isLoading={false}
                    isError={false}
                    emptyState={{
                      icon: Megaphone,
                      message: "لا توجد حملات",
                      hint: "",
                    }}
                    renderCells={(row: any) => [
                      <td key="name" className="px-5 py-4 text-sm font-medium text-natural-100">{row.name ?? row.title}</td>,
                      <td key="platform" className="px-5 py-4 text-sm text-center">{row.platform ?? "—"}</td>,
                      <td key="spend" className="px-5 py-4 text-sm text-end">{formatCurrency(row.spent ?? row.spend)}</td>,
                      <td key="impressions" className="px-5 py-4 text-sm text-center">{formatNumber(row.impressions ?? row.impressionCount)}</td>,
                      <td key="clicks" className="px-5 py-4 text-sm text-center">{formatNumber(row.clicks ?? row.clickCount)}</td>,
                      <td key="conversions" className="px-5 py-4 text-sm text-center">{formatNumber(row.conversions ?? row.conversionCount)}</td>,
                      <td key="roi" className="px-5 py-4 text-sm text-center">
                        {row.roi != null ? (
                          <span className={`font-medium ${row.roi > 0 ? "text-green-600" : row.roi < 0 ? "text-red-600" : ""}`}>
                            {row.roi}%
                          </span>
                        ) : "—"}
                      </td>,
                    ]}
                  />
                </SurfaceCard>
              )}

              {(!campaignsData.campaigns || campaignsData.campaigns.length === 0) && campaignsData.totalCampaigns > 0 && (
                <p className="text-center text-sm text-portal-note-text py-8">
                  لا توجد بيانات تفصيلية للحملات
                </p>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
