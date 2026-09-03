"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  FileText,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";
import { MetricCard } from "@/components/design-system/MetricCard";
import { PageState } from "@/components/design-system/PageState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useGetAdminReportProjectsQuery,
  useGetAdminReportRevenueQuery,
  useGetAdminReportSalesQuery,
  useGetAdminReportSatisfactionQuery,
  useGetAdminReportSnapshotsQuery,
  type AdminReportProjects,
  type AdminReportRevenue,
  type AdminReportSales,
  type AdminReportSnapshot,
  type AdminReportSatisfaction,
} from "@/features/admin/adminReportsApi";
import { formatNumber, formatShortDateLong } from "@/lib/format";
import { clientSourceLabel, requestStatusLabel } from "@/lib/i18n";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";

const reportTypes = [
  { value: "sales", label: "المبيعات", icon: Users },
  { value: "revenue", label: "الإيرادات", icon: CircleDollarSign },
  { value: "projects", label: "المشاريع", icon: BriefcaseBusiness },
  { value: "satisfaction", label: "رضا العملاء", icon: Star },
] as const;

type ReportType = (typeof reportTypes)[number]["value"];
type Period = "7d" | "30d" | "quarter" | "year";

function isReportType(value: string): value is ReportType {
  return reportTypes.some((report) => report.value === value);
}

const chartConfig = {
  value: { label: "القيمة", color: "var(--chart-1)" },
} satisfies ChartConfig;

function getRange(period: Period) {
  const end = new Date();
  const start = new Date(end);
  if (period === "7d") start.setDate(start.getDate() - 6);
  if (period === "30d") start.setDate(start.getDate() - 29);
  if (period === "quarter") start.setMonth(start.getMonth() - 3);
  if (period === "year") start.setFullYear(start.getFullYear() - 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyChart() {
  return <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">لا توجد بيانات كافية للفترة المحددة.</p>;
}

function ReportContent({ type, range }: { type: ReportType; range: ReturnType<typeof getRange> }) {
  const sales = useGetAdminReportSalesQuery(range, { skip: type !== "sales" });
  const revenue = useGetAdminReportRevenueQuery(range, { skip: type !== "revenue" });
  const projects = useGetAdminReportProjectsQuery(range, { skip: type !== "projects" });
  const satisfaction = useGetAdminReportSatisfactionQuery(range, { skip: type !== "satisfaction" });
  const query = type === "sales" ? sales : type === "revenue" ? revenue : type === "projects" ? projects : satisfaction;

  return (
    <PageState loading={query.isLoading} error={query.isError} onRetry={query.refetch}>
      {type === "sales" && sales.data && <SalesReport data={sales.data} />}
      {type === "revenue" && revenue.data && <RevenueReport data={revenue.data} />}
      {type === "projects" && projects.data && <ProjectsReport data={projects.data} />}
      {type === "satisfaction" && satisfaction.data && <SatisfactionReport data={satisfaction.data} />}
    </PageState>
  );
}

function SalesReport({ data }: { data: AdminReportSales }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard title="إجمالي الطلبات" value={formatNumber(data.totalLeads)} icon={Users} />
        <MetricCard title="معدل التحويل" value={`${data.conversionRate.toFixed(1)}%`} icon={BarChart3} variant="success" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="الطلبات حسب المرحلة"><SimpleBar data={data.leadsByStage.map((item) => ({ name: requestStatusLabel(item.stage), value: item.count }))} /></ChartCard>
        <ChartCard title="مصادر الطلبات"><SimpleBar data={data.leadsBySource.map((item) => ({ name: clientSourceLabel(item.source), value: item.count }))} /></ChartCard>
      </div>
    </div>
  );
}

function RevenueReport({ data }: { data: AdminReportRevenue }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="الإيرادات المحصلة" amount={data.paidVsUnpaid.paid.total} icon={CircleDollarSign} variant="success" />
        <MetricCard title="الفواتير غير المحصلة" amount={data.paidVsUnpaid.unpaid.total} icon={FileText} variant="warning" />
        <MetricCard title="متوسط قيمة الفاتورة" amount={data.avgInvoiceValue} icon={CircleDollarSign} />
      </div>
      <ChartCard title="اتجاه الإيرادات" description="الإجمالي الشهري للفواتير"><RevenueChart data={data.monthlyRevenue.map((item) => ({ name: formatShortDateLong(`${item.month}-01`, "short"), value: item.total }))} /></ChartCard>
    </div>
  );
}

function ProjectsReport({ data }: { data: AdminReportProjects }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="إجمالي المشاريع" value={formatNumber(data.total)} icon={BriefcaseBusiness} />
        <MetricCard title="نسبة الإنجاز" value={`${data.completionRate.toFixed(1)}%`} icon={BarChart3} variant="success" />
        <MetricCard title="المشاريع المتأخرة" value={formatNumber(data.overdueCount)} icon={BriefcaseBusiness} variant="danger" />
        <MetricCard title="متوسط المدة" value={`${data.avgDuration.toFixed(0)} يوم`} icon={RefreshCw} />
      </div>
      <ChartCard title="حالة المشاريع"><SimpleBar data={data.byStatus.map((item) => ({ name: PROJECT_STATUS_LABELS[item.status as keyof typeof PROJECT_STATUS_LABELS] ?? "حالة غير معروفة", value: item.count }))} /></ChartCard>
    </div>
  );
}

function SatisfactionReport({ data }: { data: AdminReportSatisfaction }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard title="متوسط التقييم" value={`${data.avgScore.toFixed(1)} / 5`} icon={Star} variant="success" />
        <MetricCard title="عدد التقييمات" value={formatNumber(data.trend.reduce((total, item) => total + item.count, 0))} icon={Users} />
      </div>
      <ChartCard title="اتجاه رضا العملاء" description="متوسط التقييم الشهري"><RevenueChart data={data.trend.map((item) => ({ name: formatShortDateLong(`${item.month}-01`, "short"), value: item.avgScore }))} max={5} /></ChartCard>
      <ChartCard title="التقييمات حسب الدرجة"><SimpleBar data={data.ratingsByScore.map((item) => ({ name: String(item.score), value: item.count }))} /></ChartCard>
    </div>
  );
}

const snapshotPeriodLabels: Record<AdminReportSnapshot["period"], string> = {
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
  YEARLY: "سنوي",
  CUSTOM: "مخصص",
};

function snapshotSummary(snapshot: AdminReportSnapshot) {
  const { data } = snapshot;
  const summary: string[] = [];
  if (data.sales) summary.push(`${formatNumber(data.sales.totalLeads)} طلبات مبيعات`);
  if (data.projects) summary.push(`${formatNumber(data.projects.total)} مشاريع`);
  if (data.finance) summary.push(`${formatNumber(data.finance.paidVsUnpaid.paid.count)} فواتير محصلة`);
  if (data.clients) summary.push(`${formatNumber(data.clients.clients.length)} عملاء`);
  if (data.tasks && typeof data.tasks.total === "number") summary.push(`${formatNumber(data.tasks.total)} مهام`);
  return summary.length ? summary.join(" · ") : "ملخص التقرير متاح للتفاصيل";
}

function ReportSnapshots() {
  const snapshots = useGetAdminReportSnapshotsQuery();
  const periodicSnapshots = snapshots.data?.filter((snapshot) =>
    ["WEEKLY", "MONTHLY", "YEARLY"].includes(snapshot.period),
  ) ?? [];

  return (
    <section className="flex flex-col gap-4" aria-labelledby="periodic-reports-title">
      <div>
        <h2 id="periodic-reports-title" className="text-xl font-semibold">التقارير الدورية</h2>
        <p className="text-sm text-muted-foreground">لقطات التقارير المُولّدة للفترات الأسبوعية والشهرية والسنوية.</p>
      </div>
      <PageState loading={snapshots.isLoading} error={snapshots.isError} onRetry={snapshots.refetch}>
        {periodicSnapshots.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {periodicSnapshots.map((snapshot) => (
              <Card key={snapshot.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <CardTitle className="text-base">تقرير {snapshotPeriodLabels[snapshot.period]}</CardTitle>
                      <CardDescription>{formatShortDateLong(snapshot.periodStart)} — {formatShortDateLong(snapshot.periodEnd)}</CardDescription>
                    </div>
                    <Badge variant="secondary">مُنشأ</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <p>{snapshotSummary(snapshot)}</p>
                  <p className="text-xs text-muted-foreground">تاريخ الإنشاء: {formatShortDateLong(snapshot.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="border py-8">
            <EmptyHeader>
              <EmptyTitle>لا توجد تقارير دورية</EmptyTitle>
              <EmptyDescription>ستظهر اللقطات المُولّدة هنا بعد اكتمال الفترات.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </PageState>
    </section>
  );
}

function SimpleBar({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data.length) return <EmptyChart />;
  return <ChartContainer config={chartConfig} className="h-64 w-full"><BarChart data={data} margin={{ top: 8, right: 8, left: 8 }}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} orientation="right" /><ChartTooltip content={<ChartTooltipContent formatter={(value) => <span className="font-mono font-medium tabular-nums text-foreground">{formatNumber(Number(value))}</span>} />} /><Bar dataKey="value" fill="var(--color-value)" radius={4} /></BarChart></ChartContainer>;
}

function RevenueChart({ data, max }: { data: Array<{ name: string; value: number }>; max?: number }) {
  if (!data.length) return <EmptyChart />;
  return <ChartContainer config={chartConfig} className="h-64 w-full"><LineChart data={data} margin={{ top: 8, right: 8, left: 8 }}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis domain={max ? [0, max] : undefined} tickLine={false} axisLine={false} orientation="right" /><ChartTooltip content={<ChartTooltipContent formatter={(value) => <span className="font-mono font-medium tabular-nums text-foreground">{formatNumber(Number(value))}</span>} />} /><Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={false} /></LineChart></ChartContainer>;
}

export default function Reports() {
  const [type, setType] = useState<ReportType>("sales");
  const [period, setPeriod] = useState<Period>("30d");
  const range = useMemo(() => getRange(period), [period]);

  return (
    <main className="flex flex-col gap-8 p-4 md:p-6" dir="rtl">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">مركز التحليلات</p>
        <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
        <p className="text-muted-foreground">استكشف مؤشرات الأداء واتجاهات العمل حسب الفترة والتقرير.</p>
      </header>
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-4" aria-label="خيارات التقرير">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">الفترة الزمنية</span>
          <ToggleGroup type="single" value={period} onValueChange={(value) => value && setPeriod(value as Period)} className="flex-wrap justify-start" aria-label="اختيار الفترة">
            <ToggleGroupItem value="7d" className="min-h-11">آخر 7 أيام</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="min-h-11">آخر 30 يوماً</ToggleGroupItem>
            <ToggleGroupItem value="quarter" className="min-h-11">آخر 3 أشهر</ToggleGroupItem>
            <ToggleGroupItem value="year" className="min-h-11">آخر سنة</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </section>
      <Tabs value={type} onValueChange={(value) => { if (isReportType(value)) setType(value); }} dir="rtl">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          {reportTypes.map(({ value, label, icon: Icon }) => <TabsTrigger key={value} value={value} className="min-h-11 gap-2"><Icon data-icon="inline-start" />{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={type}>
          <ReportContent type={type} range={range} />
        </TabsContent>
      </Tabs>
      <ReportSnapshots />
    </main>
  );
}
