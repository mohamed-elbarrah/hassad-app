"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  DollarSign,
  FileText,
  FolderKanban,
  Gauge,
  ListTodo,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar as RadarShape,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";
import type {
  AdminAlertsResponse,
  AdminAttentionResponse,
  AdminDashboardTeamWorkload,
  AdminFunnel,
  AdminRecentActivity,
  AdminStats,
  AdminTrendsResponse,
} from "@/features/admin/adminApi";
import {
  PERIODS,
  buildBusinessPulse,
  buildClientMix,
  buildCrmStages,
  buildExecutiveCards,
  buildHeroSummary,
  buildProjectSeries,
  buildSupportAlerts,
  buildTeamRadar,
  type PeriodKey,
  type TrendOption,
} from "@/features/admin-dashboard/dashboard-model";

function toneClass(tone: "success" | "warning" | "danger" | "neutral") {
  switch (tone) {
    case "success":
      return "bg-success text-success-foreground";
    case "warning":
      return "bg-warning text-warning-foreground";
    case "danger":
      return "bg-danger text-danger-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function ToneBadge({ tone, children }: { tone: "success" | "warning" | "danger" | "neutral"; children: ReactNode }) {
  return (
    <Badge variant={tone === "danger" ? "destructive" : tone === "neutral" ? "outline" : "secondary"} className={cn(toneClass(tone))}>
      {children}
    </Badge>
  );
}

function MetricTile({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        <ToneBadge tone={tone}>{tone === "success" ? "ممتاز" : tone === "warning" ? "تنبيه" : tone === "danger" ? "حرج" : "—"}</ToneBadge>
      </div>
    </div>
  );
}

function cardShell(children: ReactNode, className?: string) {
  return <Card className={className}>{children}</Card>;
}

export function ExecutiveGrowthCard({
  period,
  onPeriodChange,
  selectedTrend,
  onSelectTrend,
  labels,
  trendOptions,
  stats,
}: {
  period: PeriodKey;
  onPeriodChange: (value: PeriodKey) => void;
  selectedTrend: string;
  onSelectTrend: (key: string) => void;
  labels: string[];
  trendOptions: TrendOption[];
  stats: AdminStats;
}) {
  const current = trendOptions.find((item) => item.key === selectedTrend) ?? trendOptions[0];
  const chartData = useMemo(
    () => labels.map((label, index) => ({ label, value: current?.data[index] ?? 0 })),
    [labels, current],
  );
  const total = current.data.reduce((sum, value) => sum + value, 0);

  const chartConfig = {
    value: { label: current.label, color: current.color },
  } satisfies ChartConfig;

  const heroCards = buildHeroSummary(stats);

  return cardShell(
    <>
      <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              نظرة تنفيذية
            </Badge>
            <Badge variant="outline">{PERIODS[period].label}</Badge>
          </div>
          <CardTitle className="text-3xl">مركز قيادة الإدارة</CardTitle>
          <CardDescription className="max-w-2xl text-base">
            الإيرادات، القمع، التسليم، وصحة العملاء في طبقة قرار واحدة.
          </CardDescription>
        </div>
        <Tabs value={period} onValueChange={(value) => onPeriodChange(value as PeriodKey)}>
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="90d">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <div className="rounded-3xl border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{current.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {current.format === "currency" ? formatCurrency(total) : formatCompactNumber(total)}
                </p>
              </div>
              <ToneBadge tone={stats.monthlyRevenue > 0 ? "success" : "neutral"}>{period}</ToneBadge>
            </div>

            <div className="mt-4 rounded-2xl bg-muted/30 p-3">
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Area dataKey="value" type="natural" fill="var(--color-value)" stroke="var(--color-value)" fillOpacity={0.24} />
                </AreaChart>
              </ChartContainer>
            </div>
            <div className="flex flex-wrap gap-2 pt-4">
              {trendOptions.map((option) => (
                <Button key={option.key} type="button" variant={selectedTrend === option.key ? "secondary" : "ghost"} size="sm" onClick={() => onSelectTrend(option.key)}>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <Gauge className="h-3.5 w-3.5" />
                نبض الأعمال
              </Badge>
            </div>
            <div className="mt-4 h-64">
              <PulseGauge value={buildBusinessPulse(stats)} />
            </div>
            <div className="mt-4 grid gap-3">
              {heroCards.map((item) => (
                <MetricTile key={item.label} label={item.label} value={item.value} tone={item.tone} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {buildExecutiveCards(stats).map((item) => (
            <MetricTile key={item.label} label={item.label} value={item.value} tone={item.tone} />
          ))}
        </div>
      </CardContent>
    </>,
  );
}

function PulseGauge({ value }: { value: number }) {
  const data = [{ name: "pulse", value, fill: "var(--chart-1)" }];
  const config = { pulse: { label: "نبض الأعمال", color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-full w-full">
      <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="line" />} />
        <RadialBar dataKey="value" cornerRadius={999} fill="var(--color-pulse)" background={{ fill: "hsl(var(--muted))" }} />
        <Label
          content={({ viewBox }) => {
            if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
            return (
              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                <tspan x={viewBox.cx} y={viewBox.cy - 6} className="fill-foreground text-4xl font-semibold">
                  {value}
                </tspan>
                <tspan x={viewBox.cx} y={viewBox.cy + 18} className="fill-muted-foreground text-xs">
                  نبض الأعمال
                </tspan>
              </text>
            );
          }}
        />
      </RadialBarChart>
    </ChartContainer>
  );
}

export function CrmFunnelCard({ funnel }: { funnel: AdminFunnel | undefined }) {
  const stages = buildCrmStages(funnel);
  const config = Object.fromEntries(stages.map((stage) => [stage.label, { label: stage.label, color: stage.color }])) as ChartConfig;
  const conversion = funnel?.conversionRates;

  return cardShell(
    <>
      <CardHeader>
        <CardTitle className="text-xl">قمع CRM</CardTitle>
        <CardDescription>حجم العملاء المتوقعين وتركيز المراحل.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-2xl border p-3">
            <ChartContainer config={config} className="h-80 w-full">
              <BarChart data={stages} layout="vertical" margin={{ left: 12, right: 20, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={90} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="value" radius={8}>
                  {stages.map((stage) => (
                    <Cell key={stage.label} fill={stage.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          <div className="rounded-2xl border p-3">
            <ChartContainer config={config} className="h-80 w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={stages} dataKey="value" nameKey="label" innerRadius={54} outerRadius={90} paddingAngle={2}>
                  {stages.map((stage) => (
                    <Cell key={stage.label} fill={stage.color} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                      const total = stages.reduce((sum, item) => sum + item.value, 0);
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy - 6} className="fill-foreground text-3xl font-semibold">
                            {formatCompactNumber(total)}
                          </tspan>
                          <tspan x={viewBox.cx} y={viewBox.cy + 16} className="fill-muted-foreground text-xs">
                            إجمالي القمع
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToneBadge tone="neutral">Leads {formatNumber(funnel?.leads ?? 0)}</ToneBadge>
          <ToneBadge tone="success">Contracts {formatNumber(funnel?.contracts ?? 0)}</ToneBadge>
          <ToneBadge tone="warning">Projects {formatNumber(funnel?.projects ?? 0)}</ToneBadge>
          <ToneBadge tone="danger">Payments {formatNumber(funnel?.payments ?? 0)}</ToneBadge>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Leads → Clients" value={`${formatNumber(conversion?.leadsToClients ?? 0)}%`} tone={((conversion?.leadsToClients ?? 0) >= 35) ? "success" : "warning"} />
          <MetricTile label="Proposals → Contracts" value={`${formatNumber(conversion?.proposalsToContracts ?? 0)}%`} tone={((conversion?.proposalsToContracts ?? 0) >= 40) ? "success" : "warning"} />
          <MetricTile label="Contracts → Projects" value={`${formatNumber(conversion?.contractsToProjects ?? 0)}%`} tone={((conversion?.contractsToProjects ?? 0) >= 50) ? "success" : "warning"} />
          <MetricTile label="Invoices → Payments" value={`${formatNumber(conversion?.invoicesToPayments ?? 0)}%`} tone={((conversion?.invoicesToPayments ?? 0) >= 60) ? "success" : "danger"} />
        </div>
      </CardContent>
    </>,
  );
}

export function ProjectsTrendCard({ trends, stats }: { trends: AdminTrendsResponse | undefined; stats: AdminStats | undefined }) {
  const data = buildProjectSeries(trends, stats);
  const config = {
    newProjects: { label: "New projects", color: "var(--chart-2)" },
    tasksCompleted: { label: "Tasks completed", color: "var(--chart-4)" },
  } satisfies ChartConfig;

  return cardShell(
    <>
      <CardHeader>
        <CardTitle className="text-xl">إيقاع المشاريع</CardTitle>
        <CardDescription>كيف يتحرك التسليم مقابل تدفق المشاريع.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-2xl border p-3">
          <ChartContainer config={config} className="h-80 w-full">
            <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line dataKey="newProjects" type="monotone" stroke="var(--color-newProjects)" strokeWidth={2} dot={false} />
              <Line dataKey="tasksCompleted" type="monotone" stroke="var(--color-tasksCompleted)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="Active projects" value={formatNumber(stats?.activeProjects ?? 0)} tone={(stats?.activeProjects ?? 0) > 0 ? "success" : "neutral"} />
          <MetricTile label="Completed projects" value={formatNumber(stats?.completedProjects ?? 0)} tone="success" />
          <MetricTile label="Stalled tasks" value={formatNumber(stats?.overdueTasks ?? 0)} tone={(stats?.overdueTasks ?? 0) > 0 ? "danger" : "success"} />
        </div>
      </CardContent>
    </>,
  );
}

export function TeamRadarCard({
  stats,
  workload,
}: {
  stats: AdminStats | undefined;
  workload: AdminDashboardTeamWorkload | undefined;
}) {
  const data = buildTeamRadar(stats, workload);
  const config = {
    team: { label: "Team score", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  const members = workload?.members ?? [];

  return cardShell(
    <>
      <CardHeader>
        <CardTitle className="text-xl">اتزان الفريق</CardTitle>
        <CardDescription>السعة والجودة واتزان التسليم عبر الفريق.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-2xl border p-3">
          <ChartContainer config={config} className="h-80 w-full">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tickLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <RadarShape dataKey="value" stroke="var(--color-team)" fill="var(--color-team)" fillOpacity={0.2} />
            </RadarChart>
          </ChartContainer>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile label="Team members" value={formatNumber(workload?.summary.total ?? 0)} tone="neutral" />
          <MetricTile label="Avg quality" value={`${formatNumber((members.reduce((s, m) => s + (m.avgQualityScore ?? 0), 0) / Math.max(members.length, 1)) || 0)}%`} tone="success" />
          <MetricTile label="Avg speed" value={members.length ? `${formatNumber(members.reduce((s, m) => s + (m.avgCompletionSpeedDays ?? 0), 0) / members.length)}d` : "—"} tone="warning" />
        </div>
      </CardContent>
    </>,
  );
}

export function ClientsPieCard({
  stats,
  alerts,
  attention,
}: {
  stats: AdminStats | undefined;
  alerts: AdminAlertsResponse | undefined;
  attention: AdminAttentionResponse | undefined;
}) {
  const data = buildClientMix(stats, alerts, attention);
  const config = Object.fromEntries(data.map((item) => [item.name, { label: item.name, color: item.fill }])) as ChartConfig;

  return cardShell(
    <>
      <CardHeader>
        <CardTitle className="text-xl">إشارات العملاء</CardTitle>
        <CardDescription>إشارات المحفظة، ضغط التسرب، وزخم الحسابات.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-2xl border p-3">
          <ChartContainer config={config} className="h-80 w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={2}>
                {data.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                    const total = data.reduce((sum, item) => sum + item.value, 0);
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy - 6} className="fill-foreground text-3xl font-semibold">
                          {formatNumber(total)}
                        </tspan>
                        <tspan x={viewBox.cx} y={viewBox.cy + 16} className="fill-muted-foreground text-xs">
                          إشارات العملاء
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MetricTile label="Retention" value={`${formatNumber(stats?.retentionRate ?? 0)}%`} tone={(stats?.retentionRate ?? 0) >= 80 ? "success" : "warning"} />
          <MetricTile label="Churn" value={`${formatNumber(stats?.churnRate ?? 0)}%`} tone={(stats?.churnRate ?? 0) <= 10 ? "success" : "danger"} />
        </div>
      </CardContent>
    </>,
  );
}

export function SupportPanels({
  alerts,
  attention,
  activity,
  aiPending,
  aiAnalyses,
}: {
  alerts: AdminAlertsResponse | undefined;
  attention: AdminAttentionResponse | undefined;
  activity: AdminRecentActivity[];
  aiPending: number;
  aiAnalyses: Array<{ id: string; summary: string; score: number | null; triggeredBy: string | null; createdAt: string; recommendations: string[] }>;
}) {
  const groups = buildSupportAlerts(alerts, attention);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">تنبيهات تنفيذية</CardTitle>
          <CardDescription>العناصر التي تحتاج قرارًا بشريًا الآن.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No urgent alerts.</p>
          ) : (
            groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-3 rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", group.tone === "danger" ? "bg-danger" : group.tone === "warning" ? "bg-warning" : "bg-muted-foreground")} />
                    <p className="font-medium">{group.title}</p>
                  </div>
                  <ToneBadge tone={group.tone}>{formatNumber(group.count)}</ToneBadge>
                </div>
                <div className="flex flex-col gap-2">
                  {group.items.map((item, index) => (
                    <div key={`${group.key}-${index}`} className="rounded-xl bg-muted/40 p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                  ))}
                </div>
                <Button asChild variant="ghost" className="w-fit px-0 text-xs">
                  <Link href={group.href}>فتح اللوحة</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">الإشارات والنشاط</CardTitle>
          <CardDescription>الذكاء الاصطناعي، السجل، وآخر حركة تشغيلية.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">الاقتراحات الذكية المعلقة</p>
              <ToneBadge tone={aiPending > 0 ? "warning" : "success"}>{formatNumber(aiPending)}</ToneBadge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">راجع التحليلات الحديثة قبل المسح التالي.</p>
          </div>

          <div className="flex flex-col gap-3">
            {aiAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد تحليلات حديثة.</p>
            ) : (
              aiAnalyses.map((analysis) => (
                <div key={analysis.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{analysis.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{analysis.triggeredBy ?? "مسح تلقائي"} • {formatRelativeTime(analysis.createdAt)}</p>
                    </div>
                    <ToneBadge tone={analysis.score == null ? "neutral" : analysis.score >= 70 ? "success" : analysis.score >= 40 ? "warning" : "danger"}>
                      {analysis.score == null ? "—" : `${formatNumber(analysis.score)}%`}
                    </ToneBadge>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد نشاط حديث.</p>
            ) : (
              activity.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.userName ?? "النظام"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.action}</p>
                    </div>
                    <Badge variant="outline">{item.entity}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuickActionsPanel() {
  const actions = [
    { label: "Employees", href: "/dashboard/admin/employees", icon: Users },
    { label: "Clients", href: "/dashboard/admin/clients", icon: UserCheck },
    { label: "Projects", href: "/dashboard/admin/projects", icon: FolderKanban },
    { label: "Tasks", href: "/dashboard/admin/tasks", icon: ListTodo },
    { label: "Finance", href: "/dashboard/admin/finance", icon: DollarSign },
    { label: "Reports", href: "/dashboard/admin/reports", icon: FileText },
    { label: "AI", href: "/dashboard/admin/ai", icon: Sparkles },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Gauge },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">إجراءات سريعة</CardTitle>
        <CardDescription>اختصارات لأكثر مهام الإدارة استخدامًا.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Button key={action.href} asChild variant="outline" className="h-auto justify-start gap-3 rounded-2xl p-4 text-right">
              <Link href={action.href}>
                <action.icon className="h-5 w-5 text-primary" />
                <span>{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
