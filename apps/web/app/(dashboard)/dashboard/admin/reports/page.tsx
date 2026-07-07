"use client";

import { useState } from "react";
import {
  BarChart3,
  DollarSign,
  FolderKanban,
  Users,
  Star,
  Megaphone,
  TrendingUp,
  Minus,
} from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import {
  useGetAdminReportSalesQuery,
  useGetAdminReportRevenueQuery,
  useGetAdminReportProjectsQuery,
  useGetAdminReportTeamPerformanceQuery,
  useGetAdminReportSatisfactionQuery,
  useGetAdminReportCampaignsQuery,
} from "@/features/admin/adminApi";
import { EmptyState } from "@/components/design-system/EmptyState";
import { GaugeChart } from "@/components/design-system/GaugeChart";
import { formatCurrency, formatNumber } from "@/lib/format";

const REPORT_TABS = [
  { value: "sales", label: "المبيعات", icon: TrendingUp },
  { value: "revenue", label: "الإيرادات", icon: DollarSign },
  { value: "projects", label: "المشاريع", icon: FolderKanban },
  { value: "team", label: "أداء الفريق", icon: Users },
  { value: "satisfaction", label: "رضا العملاء", icon: Star },
  { value: "campaigns", label: "الحملات", icon: Megaphone },
];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");

  const { data: salesData, isLoading: salesLoading } = useGetAdminReportSalesQuery({});
  const { data: revenueData, isLoading: revenueLoading } = useGetAdminReportRevenueQuery({});
  const { data: projectsData, isLoading: projectsLoading } = useGetAdminReportProjectsQuery({});
  const { data: teamData, isLoading: teamLoading } = useGetAdminReportTeamPerformanceQuery({});
  const { data: satisfactionData, isLoading: satisfactionLoading } = useGetAdminReportSatisfactionQuery({});
  const { data: campaignsData, isLoading: campaignsLoading } = useGetAdminReportCampaignsQuery({});

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title="التقارير والإحصائيات"
        description="نظرة شاملة على أداء المنصة"
        icon={BarChart3}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
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

        {/* ── Sales Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="sales" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي العملاء المتوقعين" value={formatNumber(salesData?.totalLeads)} icon={TrendingUp} />
            <StatCard title="العملاء المحولون" value={formatNumber(salesData?.convertedClients)} icon={TrendingUp} variant="success" />
            <StatCard title="نسبة التحويل" value={salesData?.conversionRate != null ? `${salesData.conversionRate}%` : "—"} icon={TrendingUp} variant="success" />
            <StatCard title="مصادر متنوعة" value={salesData?.sourcesCount ?? salesData?.bySource?.length ?? 0} icon={Minus} />
          </div>

          {salesData?.byStage?.length > 0 && (
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
                        style={{ width: `${stage.percentage ?? (stage.count / salesData.totalLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {salesData?.bySource?.length > 0 && (
            <SurfaceCard title="العملاء حسب المصدر">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(salesData.bySource as any[]).map((source: any, idx: number) => {
                  const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
                  return (
                    <div key={source.source ?? idx} className="flex items-center gap-3 rounded-xl border border-portal-divider p-4">
                      <div className={`h-10 w-10 rounded-full ${colors[idx % colors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                        {source.count ?? source.value}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-natural-100">{source.source ?? source.name}</p>
                        <p className="text-xs text-portal-note-text">{source.count ?? source.value} عميل</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          )}

          {salesLoading && <p className="text-center text-portal-note-text">جاري التحميل...</p>}
          {!salesLoading && !salesData && <EmptyState icon={TrendingUp} title="لا توجد بيانات مبيعات" hint="لم يتم تسجيل أي بيانات مبيعات بعد" />}
        </TabsContent>

        {/* ── Revenue Tab ────────────────────────────────────────────────── */}
        <TabsContent value="revenue" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي الإيرادات" value={formatCurrency(revenueData?.totalRevenue)} icon={DollarSign} />
            <StatCard title="المدفوع" value={formatCurrency(revenueData?.paidRevenue)} icon={DollarSign} variant="success" />
            <StatCard title="غير المدفوع" value={formatCurrency(revenueData?.unpaidRevenue)} icon={DollarSign} variant="danger" />
            <StatCard title="متوسط قيمة الفاتورة" value={formatCurrency(revenueData?.avgInvoiceValue)} icon={DollarSign} />
          </div>

          {revenueData?.monthlyTrend?.length > 0 && (
            <SurfaceCard title="الاتجاه الشهري للإيرادات">
              <div className="flex items-end gap-2 h-48">
                {(revenueData.monthlyTrend as any[]).map((month: any, idx: number) => {
                  const maxVal = Math.max(...revenueData.monthlyTrend.map((m: any) => m.revenue ?? m.value ?? 0), 1);
                  const height = ((month.revenue ?? month.value ?? 0) / maxVal) * 100;
                  return (
                    <div key={month.month ?? idx} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-portal-note-text">
                        {formatCurrency(month.revenue ?? month.value)}
                      </span>
                      <div className="w-full rounded-t-md bg-secondary-500 min-h-[4px]" style={{ height: `${Math.max(height, 2)}%` }} />
                      <span className="text-xs text-portal-note-text">{month.month ?? month.label}</span>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          )}

          {revenueData?.topClients?.length > 0 && (
            <SurfaceCard title="أفضل العملاء">
              <div className="space-y-3">
                {(revenueData.topClients as any[]).slice(0, 10).map((client: any, idx: number) => (
                  <div key={client.id ?? idx} className="flex items-center justify-between py-2 border-b border-portal-divider last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-portal-note-text w-6">{idx + 1}</span>
                      <span className="text-sm font-medium text-natural-100">{client.name ?? client.companyName}</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(client.revenue ?? client.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {revenueLoading && <p className="text-center text-portal-note-text">جاري التحميل...</p>}
          {!revenueLoading && !revenueData && <EmptyState icon={DollarSign} title="لا توجد بيانات إيرادات" hint="لم يتم تسجيل أي إيرادات بعد" />}
        </TabsContent>

        {/* ── Projects Tab ───────────────────────────────────────────────── */}
        <TabsContent value="projects" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي المشاريع" value={formatNumber(projectsData?.totalProjects)} icon={FolderKanban} />
            <StatCard title="قيد التنفيذ" value={formatNumber(projectsData?.activeProjects)} icon={FolderKanban} variant="success" />
            <StatCard title="مكتملة" value={formatNumber(projectsData?.completedProjects)} icon={FolderKanban} variant="success" />
            <StatCard title="متأخرة" value={formatNumber(projectsData?.overdueProjects)} icon={FolderKanban} variant="danger" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projectsData?.avgDuration != null && (
              <StatCard title="متوسط المدة (أيام)" value={projectsData.avgDuration} icon={FolderKanban} />
            )}
            {projectsData?.completionRate != null && (
              <StatCard title="نسبة الإنجاز" value={`${projectsData.completionRate}%`} icon={FolderKanban} variant="success" />
            )}
          </div>

          {projectsData?.byStatus?.length > 0 && (
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
                        style={{ width: `${item.percentage ?? (item.count / projectsData.totalProjects) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {projectsLoading && <p className="text-center text-portal-note-text">جاري التحميل...</p>}
          {!projectsLoading && !projectsData && <EmptyState icon={FolderKanban} title="لا توجد بيانات مشاريع" hint="لم يتم إنشاء أي مشاريع بعد" />}
        </TabsContent>

        {/* ── Team Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="team" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي الفريق" value={formatNumber(teamData?.totalMembers)} icon={Users} />
            <StatCard title="متاح" value={formatNumber(teamData?.availableMembers)} icon={Users} variant="success" />
            <StatCard title="مشغول" value={formatNumber(teamData?.busyMembers)} icon={Users} variant="warning" />
            <StatCard title="مثقل" value={formatNumber(teamData?.overloadedMembers)} icon={Users} variant="danger" />
          </div>

          {teamData?.averageLoad != null && (
            <StatCard title="متوسط عبء العمل" value={`${teamData.averageLoad}%`} icon={Users} />
          )}

          {teamLoading && <p className="text-center text-portal-note-text">جاري التحميل...</p>}
          {!teamLoading && !teamData && <EmptyState icon={Users} title="لا توجد بيانات أداء الفريق" hint="لم يتم تسجيل بيانات أداء الفريق بعد" />}
        </TabsContent>

        {/* ── Satisfaction Tab ───────────────────────────────────────────── */}
        <TabsContent value="satisfaction" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SurfaceCard title="متوسط التقييم" className="flex flex-col items-center justify-center">
              <GaugeChart
                value={satisfactionData?.avgScore != null ? Math.round((satisfactionData.avgScore / 5) * 100) : 0}
              />
              <p className="text-sm text-portal-note-text text-center mt-1">
                {satisfactionData?.avgScore != null ? `${satisfactionData.avgScore} / 5` : "—"}
              </p>
            </SurfaceCard>
            <StatCard title="إجمالي التقييمات" value={formatNumber(satisfactionData?.totalRatings)} icon={Star} />
            <StatCard title="التقييمات المنخفضة" value={formatNumber(satisfactionData?.lowRatings)} icon={Star} variant="danger" />
          </div>

          {satisfactionData?.distribution?.length > 0 && (
            <SurfaceCard title="توزيع التقييمات">
              <div className="space-y-3">
                {([5, 4, 3, 2, 1] as const).map((score) => {
                  const item = (satisfactionData.distribution as any[]).find((d: any) => Number(d.score ?? d.rating) === score);
                  const count = item?.count ?? 0;
                  const total = satisfactionData?.totalRatings ?? 1;
                  const pct = (count / total) * 100;
                  const barColors: Record<number, string> = { 5: "bg-green-500", 4: "bg-blue-500", 3: "bg-yellow-500", 2: "bg-orange-500", 1: "bg-red-500" };
                  return (
                    <div key={score} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{score} ★</span>
                      <div className="flex-1 h-3 rounded-full bg-neutral-100 overflow-hidden">
                        <div className={`h-full rounded-full ${barColors[score]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-portal-note-text w-10 text-left">{count}</span>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          )}

          {satisfactionLoading && <p className="text-center text-portal-note-text">جاري التحميل...</p>}
          {!satisfactionLoading && !satisfactionData && <EmptyState icon={Star} title="لا توجد بيانات رضا العملاء" hint="لم يتم تسجيل أي تقييمات بعد" />}
        </TabsContent>

        {/* ── Campaigns Tab ──────────────────────────────────────────────── */}
        <TabsContent value="campaigns" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي الحملات" value={formatNumber(campaignsData?.totalCampaigns)} icon={Megaphone} />
            <StatCard title="النشطة" value={formatNumber(campaignsData?.activeCampaigns)} icon={Megaphone} variant="success" />
            <StatCard title="المنتهية" value={formatNumber(campaignsData?.endedCampaigns)} icon={Megaphone} />
            <StatCard title="عائد الاستثمار" value={campaignsData?.avgRoi != null ? `${campaignsData.avgRoi}%` : "—"} icon={Megaphone} variant="success" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="إجمالي الميزانية" value={formatCurrency(campaignsData?.totalBudget)} icon={DollarSign} />
            <StatCard title="إجمالي المصروف" value={formatCurrency(campaignsData?.totalSpent)} icon={DollarSign} variant="warning" />
            {campaignsData?.roi != null && (
              <StatCard title="العائد على الاستثمار" value={campaignsData.roi} icon={TrendingUp} variant="success" />
            )}
          </div>

          {campaignsData?.byPlatform?.length > 0 && (
            <SurfaceCard title="الحملات حسب المنصة">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(campaignsData.byPlatform as any[]).map((platform: any, idx: number) => {
                  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"];
                  return (
                    <div key={platform.platform ?? idx} className="rounded-xl border border-portal-divider p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`h-3 w-3 rounded-full ${colors[idx % colors.length]}`} />
                        <span className="text-sm font-medium text-natural-100">{platform.platform ?? platform.name}</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-portal-note-text">الميزانية</span>
                          <span>{formatCurrency(platform.budget)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-portal-note-text">المصروف</span>
                          <span>{formatCurrency(platform.spent)}</span>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className="h-full rounded-full bg-secondary-500" style={{ width: `${platform.budget ? (platform.spent / platform.budget) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          )}

          {campaignsData?.byStatus?.length > 0 && (
            <SurfaceCard title="الحملات حسب الحالة">
              <div className="flex flex-wrap gap-3">
                {(campaignsData.byStatus as any[]).map((item: any) => (
                  <div key={item.status ?? item.name} className="flex items-center gap-2 rounded-xl border border-portal-divider px-4 py-3">
                    <StatusBadge status={item.status ?? item.name} />
                    <span className="text-sm font-medium">{item.count ?? item.value}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}

          {campaignsLoading && <p className="text-center text-portal-note-text">جاري التحميل...</p>}
          {!campaignsLoading && !campaignsData && <EmptyState icon={Megaphone} title="لا توجد بيانات حملات" hint="لم يتم إنشاء أي حملات بعد" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
