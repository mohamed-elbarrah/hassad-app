"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetAdminStatsQuery,
  useGetTrendDataQuery,
  useGetFunnelDataQuery,
  useGetAlertsDataQuery,
  useGetHealthQuery,
  useGetRecentActivityQuery,
} from "@/features/admin/adminApi";
import { NeedsAttentionCard } from "@/components/dashboard/admin/NeedsAttentionCard";
import { RecentActivityFeed } from "@/components/dashboard/admin/RecentActivityFeed";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { DashboardCard } from "@/components/design-system/DashboardCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { IconCircle } from "@/components/design-system/IconCircle";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { KpiPill, KpiCurrency } from "@/components/design-system/KpiPill";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  UserCheck,
  Ticket,
  Settings,
  Server,
  Database,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronLeft,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function TrendArrow({ value }: { value?: number }) {
  if (value == null || value === 0)
    return <Minus className="w-3.5 h-3.5 text-neutral-300" />;
  if (value > 0)
    return <ArrowUpRight className="w-3.5 h-3.5 text-success-600" />;
  return <ArrowDownRight className="w-3.5 h-3.5 text-danger-500" />;
}

// ── Hero KPIs ───────────────────────────────────────────────────────────────

function HeroKpis({ stats, isLoading }: { stats?: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Revenue — brand gold emphasis */}
      <div className="min-w-[132px] rounded-2xl px-4 py-3 bg-gradient-to-bl from-primary-100 to-primary-200/60 ring-1 ring-inset ring-primary-300/60">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary-700">
          <DollarSign className="h-3.5 w-3.5" />
          <span>الإيرادات الشهرية</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <KpiCurrency
            amount={stats?.monthlyRevenue}
            className="text-primary-800"
          />
          <TrendArrow value={stats?.revenueChange} />
        </div>
        {stats?.revenueChange != null && (
          <p className="text-[11px] text-primary-700/70 mt-1">
            {Math.abs(stats.revenueChange)}% عن الشهر الماضي
          </p>
        )}
      </div>

      <KpiPill
        label="المستخدمين"
        value={
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-natural-100">
              {stats?.totalUsers?.toLocaleString() ?? "—"}
            </span>
            <TrendArrow value={stats?.recentUsers} />
          </div>
        }
      />

      <KpiPill
        label="العملاء النشطين"
        value={
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-natural-100">
              {stats?.activeClients?.toLocaleString() ?? "—"}
            </span>
            <TrendArrow value={stats?.newClientsThisMonth} />
          </div>
        }
      />

      <KpiPill
        label="المشاريع الجارية"
        value={
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-natural-100">
              {stats?.activeProjects?.toLocaleString() ?? "—"}
            </span>
          </div>
        }
      />
    </div>
  );
}

// ── Revenue chart ────────────────────────────────────────────────────────────

function RevenueChart({
  data,
  isLoading,
}: {
  data: { label: string; value: number }[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
    <SurfaceCard
      className="h-[360px] flex flex-col"
      contentClassName="flex-1 min-h-0"
    >
      <Skeleton className="h-full w-full rounded-2xl" />
    </SurfaceCard>
  );

  return (
    <SurfaceCard
      className="h-[360px] flex flex-col"
      contentClassName="flex-1 min-h-0"
      title="الإيرادات الشهرية"
      description="آخر 30 يوم"
      icon={TrendingUp}
    >
        <Skeleton className="h-full w-full rounded-2xl" />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      className="lg:col-span-2 h-[360px] flex flex-col"
      contentClassName="flex-1 min-h-0"
      title="الإيرادات الشهرية"
      description="آخر 30 يوم"
      icon={TrendingUp}
    >
      <div className="h-full" dir="ltr">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e7be52" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#e7be52" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#ECEEF2"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6f7485", fontSize: 11 }}
                dy={8}
                minTickGap={24}
              />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6f7485", fontSize: 11 }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
                width={44}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div
                      className="rounded-xl border border-portal-card-border bg-natural-0 shadow-lg px-3 py-2 min-w-[140px]"
                      dir="rtl"
                    >
                      <p className="text-[11px] text-portal-note-text mb-1">
                        {label}
                      </p>
                      <CurrencyDisplay amount={payload[0].value} size="sm" />
                    </div>
                  );
                }}
                cursor={{ stroke: "#E1E4EA", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#e7be52"
                strokeWidth={3}
                fill="url(#revenueFill)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-portal-note-text">
            لا توجد بيانات
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

// ── Users bar chart ──────────────────────────────────────────────────────────

function UsersBarChart({
  data,
  isLoading,
}: {
  data: { label: string; users: number; clients: number }[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <SurfaceCard
        className="h-[360px] flex flex-col"
        contentClassName="flex-1 min-h-0"
      >
        <Skeleton className="h-full w-full rounded-2xl" />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      className="h-[360px] flex flex-col"
      contentClassName="flex-1 min-h-0"
      title="المستخدمين والعملاء"
      description="آخر 30 يوم"
      icon={Users}
    >
      <div className="h-full" dir="ltr">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#ECEEF2"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6f7485", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6f7485", fontSize: 11 }}
                width={44}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div
                      className="rounded-xl border border-portal-card-border bg-natural-0 shadow-lg px-3 py-2 min-w-[140px]"
                      dir="rtl"
                    >
                      <p className="text-[11px] text-portal-note-text mb-1">
                        {label}
                      </p>
                      {payload.map((p: any) => (
                        <div
                          key={p.dataKey}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: p.color }}
                            />
                            <span className="text-portal-note-text">
                              {p.dataKey === "users" ? "مستخدمون" : "عملاء"}
                            </span>
                          </span>
                          <span className="font-bold text-natural-100">
                            {p.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
                cursor={{ fill: "rgba(18, 25, 54, 0.03)" }}
              />
              <Bar
                dataKey="users"
                fill="#121936"
                radius={[6, 6, 0, 0]}
                barSize={16}
                animationDuration={700}
              />
              <Bar
                dataKey="clients"
                fill="#0ed589"
                radius={[6, 6, 0, 0]}
                barSize={16}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-portal-note-text">
            لا توجد بيانات
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

// ── Funnel card ─────────────────────────────────────────────────────────────

function FunnelCard({
  funnel,
  isLoading,
}: {
  funnel?: any;
  isLoading: boolean;
}) {
  if (isLoading || !funnel) {
    return (
      <DashboardCard title="مسار التحويل" icon={Activity} showAll={false}>
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-xl" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  const stages = [
    { label: "عملاء محتملون", value: funnel.leads, color: "bg-secondary-500" },
    { label: "عملاء", value: funnel.clients, color: "bg-secondary-400" },
    { label: "عروض", value: funnel.proposals, color: "bg-action-purple" },
    { label: "عقود", value: funnel.contracts, color: "bg-action-purple" },
    { label: "مشاريع", value: funnel.projects, color: "bg-primary-500" },
    { label: "فواتير", value: funnel.invoices, color: "bg-primary-500" },
    { label: "مدفوعات", value: funnel.payments, color: "bg-success-500" },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <DashboardCard title="مسار التحويل" icon={Activity} showAll={false}>
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const width = (stage.value / max) * 100;
          const prev = idx > 0 ? stages[idx - 1].value : 0;
          const rate = prev > 0 ? Math.round((stage.value / prev) * 100) : 100;
          return (
            <div key={stage.label} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-natural-100 font-medium">
                  {stage.label}
                </span>
                <div className="flex items-center gap-2">
                  {idx > 0 && (
                    <span className="text-[11px] text-portal-note-text">
                      {rate}% تحويل
                    </span>
                  )}
                  <span className="font-bold text-natural-100">
                    {stage.value.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-8 rounded-2xl bg-badge-gray-bg overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-2xl flex items-center px-3 transition-all duration-700",
                    stage.color,
                  )}
                  style={{ width: `${Math.max(width, 4)}%` }}
                >
                  {width > 12 && (
                    <span className="text-[11px] font-bold text-white/90 drop-shadow">
                      {width.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

// ── Role distribution ──────────────────────────────────────────────────────

function RoleDistribution({
  data,
  total,
  isLoading,
}: {
  data: { name: string; value: number }[];
  total: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <DashboardCard title="توزيع المستخدمين" icon={Users} showAll={false}>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </DashboardCard>
    );
  }

  const colors = [
    "#121936",
    "#0ed589",
    "#7a13e8",
    "#2684fc",
    "#f8af01",
    "#00aeff",
  ];

  return (
    <DashboardCard title="توزيع المستخدمين" icon={Users} showAll={false}>
      {data.length > 0 ? (
        <div className="flex flex-col h-full">
          <div className="h-[220px] relative" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div
                        className="rounded-xl border border-portal-card-border bg-natural-0 shadow-lg px-3 py-2 min-w-[120px]"
                        dir="rtl"
                      >
                        <p className="text-[11px] text-portal-note-text">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold text-natural-100">
                          {item.value.toLocaleString()}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-natural-100">
                {total.toLocaleString()}
              </span>
              <span className="text-[11px] text-portal-note-text">مستخدم</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {data.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="text-xs text-portal-note-text truncate">
                  {item.name}
                </span>
                <span className="text-xs font-bold text-natural-100 mr-auto">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-portal-note-text">
          لا توجد بيانات
        </div>
      )}
    </DashboardCard>
  );
}

// ── Health mini cards ───────────────────────────────────────────────────────

function HealthCards({
  health,
  isLoading,
}: {
  health?: any;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  const status = health?.status === "healthy";
  const db = health?.database === "connected";
  const uptime = health?.uptime ? (health.uptime / 3600).toFixed(1) : "—";

  const items = [
    {
      icon: Server,
      label: "حالة النظام",
      value: status ? "صحي" : "يتطلب مراجعة",
      color: status ? "text-success-600" : "text-alert-600",
    },
    {
      icon: Database,
      label: "قاعدة البيانات",
      value: db ? "متصلة" : "غير متصلة",
      color: db ? "text-success-600" : "text-danger-600",
    },
    {
      icon: Zap,
      label: "نشطون الآن",
      value: (health?.activeUsersLastHour ?? 0).toLocaleString(),
      color: "text-action-blue",
    },
    {
      icon: Clock,
      label: "مدة التشغيل",
      value: `${uptime} س`,
      color: "text-action-purple",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-portal-card-border bg-natural-0 p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-badge-gray-bg flex items-center justify-center shrink-0">
            <item.icon className={cn("w-5 h-5", item.color)} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-portal-note-text">{item.label}</p>
            <p className="text-sm font-bold text-natural-100 truncate">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Quick actions ────────────────────────────────────────────────────────────

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="h-full rounded-2xl border border-portal-card-border bg-natural-0 p-4 flex items-center gap-3 hover:border-secondary-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-natural-100">{title}</p>
          <p className="text-[11px] text-portal-note-text truncate">
            {description}
          </p>
        </div>
        <ChevronLeft className="w-4 h-4 text-portal-note-text group-hover:text-secondary-500 mr-auto shrink-0" />
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-5 pb-6" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="lg:col-span-2 h-[360px] rounded-[30px]" />
        <Skeleton className="h-[360px] rounded-[30px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="h-[380px] rounded-[30px]" />
        <Skeleton className="h-[380px] rounded-[30px]" />
        <Skeleton className="h-[380px] rounded-[30px]" />
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { fmtNumber } = useCurrency();

  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: trends, isLoading: trendsLoading } = useGetTrendDataQuery({
    days: 30,
  });
  const { data: funnel, isLoading: funnelLoading } = useGetFunnelDataQuery();
  const { data: alerts, isLoading: alertsLoading } = useGetAlertsDataQuery();
  const { data: health, isLoading: healthLoading } = useGetHealthQuery();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivityQuery();

  const isLoading =
    statsLoading ||
    trendsLoading ||
    funnelLoading ||
    alertsLoading ||
    healthLoading ||
    activityLoading;

  const revenueData = useMemo(() => {
    if (!trends?.revenue || !trends?.labels) return [];
    return trends.revenue
      .map((v, i) => ({ value: v, label: trends.labels[i] }))
      .reverse();
  }, [trends]);

  const usersBarData = useMemo(() => {
    if (!trends?.newUsers || !trends?.newClients || !trends?.labels) return [];
    return trends.newUsers
      .map((v, i) => ({
        label: trends.labels[i],
        users: v,
        clients: trends.newClients[i] ?? 0,
      }))
      .reverse();
  }, [trends]);

  const roleData = useMemo(() => {
    if (!stats?.usersByRole) return [];
    return stats.usersByRole.map((item) => ({
      name: item.role,
      value: item.count,
    }));
  }, [stats]);

  if (!user) return null;
  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-5 pb-6" dir="rtl">
      <PageIntro
        title="مركز القيادة"
        description={`مرحباً، ${user.name || "الإدارة"} — نظرة شاملة على أداء المنصة`}
        icon={LayoutDashboard}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              href="/dashboard/admin/users"
              variant="primary"
              size="md"
              icon={<Users className="w-4 h-4" />}
            >
              المستخدمين
            </ActionButton>
            <ActionButton
              href="/dashboard/admin/roles"
              variant="outline"
              size="md"
              icon={<UserCheck className="w-4 h-4" />}
            >
              الأدوار
            </ActionButton>
            <ActionButton
              href="/dashboard/admin/settings"
              variant="outline"
              size="md"
              icon={<Settings className="w-4 h-4" />}
            >
              الإعدادات
            </ActionButton>
            <ActionButton
              href="/dashboard/admin/audit-log"
              variant="ghost"
              size="md"
              icon={<FileText className="w-4 h-4" />}
            >
              السجل
            </ActionButton>
          </div>
        }
      />

      <HealthCards health={health} isLoading={healthLoading} />

      <HeroKpis stats={stats} isLoading={statsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} isLoading={trendsLoading} />
        </div>
        <NeedsAttentionCard alerts={alerts} isLoading={alertsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <UsersBarChart data={usersBarData} isLoading={trendsLoading} />
        <FunnelCard funnel={funnel} isLoading={funnelLoading} />
        <RecentActivityFeed activities={recentActivity} isLoading={activityLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RoleDistribution
          data={roleData}
          total={stats?.totalUsers ?? roleData.reduce((s, r) => s + r.value, 0)}
          isLoading={statsLoading}
        />
        <DashboardCard title="إجراءات سريعة" icon={Activity} showAll={false}>
          <div className="grid grid-cols-1 gap-3">
            <QuickAction
              href="/dashboard/admin/users"
              icon={Users}
              title="المستخدمون"
              description="إدارة الحسابات والصلاحيات"
              color={ACCENTS.navy}
            />
            <QuickAction
              href="/dashboard/admin/roles"
              icon={UserCheck}
              title="الأدوار"
              description="إدارة الصلاحيات والأدوار"
              color={ACCENTS.purple}
            />
            <QuickAction
              href="/dashboard/admin/disputes"
              icon={Ticket}
              title="النزاعات"
              description="إدارة وحل النزاعات"
              color={ACCENTS.red}
            />
            <QuickAction
              href="/dashboard/admin/settings"
              icon={Settings}
              title="الإعدادات"
              description="تكوين المنصة والتفضيلات"
              color={ACCENTS.orange}
            />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

const ACCENTS = {
  navy: "#121936",
  green: "#0ed589",
  purple: "#7a13e8",
  blue: "#2684fc",
  orange: "#f8af01",
  red: "#ef4444",
};
