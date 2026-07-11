"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Activity,
  UserCheck,
  Ticket,
  Settings,
  ChevronLeft,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import { useDashboardNotificationSocket } from "@/hooks/useDashboardNotificationSocket";
import { TimeRangeSelector } from "@/components/design-system/TimeRangeSelector";
import type { TimeRange } from "@/components/design-system/TimeRangeSelector";
import {
  useGetAdminStatsQuery,
  useGetTrendDataQuery,
  useGetFunnelDataQuery,
  useGetAlertsDataQuery,
  useGetHealthQuery,
  useGetRecentActivityQuery,
  useGetAdminDashboardAttentionQuery,
  useGetAdminDashboardTeamWorkloadQuery,
} from "@/features/admin/adminApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DashboardCard } from "@/components/design-system/DashboardCard";
import { ActionButton } from "@/components/design-system/ActionButton";

import { HeroKpis } from "@/components/dashboard/admin/HeroKpis";
import { RevenueChart } from "@/components/dashboard/admin/RevenueChart";
import { UsersBarChart } from "@/components/dashboard/admin/UsersBarChart";
import { FunnelCard } from "@/components/dashboard/admin/FunnelCard";
import { RoleDistribution } from "@/components/dashboard/admin/RoleDistribution";
import { NeedsAttentionCards } from "@/components/dashboard/admin/NeedsAttentionCards";
import { TeamWorkload } from "@/components/dashboard/admin/TeamWorkload";
import { RecentActivityMerged } from "@/components/dashboard/admin/RecentActivityMerged";

// ── Quick Action Link ─────────────────────────────────────────────────────────

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

const ACCENTS = {
  navy: "#121936",
  green: "#0ed589",
  purple: "#7a13e8",
  blue: "#2684fc",
  orange: "#f8af01",
  red: "#ef4444",
};

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  useDashboardNotificationSocket();

  const [timeRange, setTimeRange] = useState<TimeRange>("last30days");

  const days = useMemo(() => {
    switch (timeRange) {
      case "last7days": return 7;
      case "last30days": return 30;
      case "last12months": return 365;
      default: return 30;
    }
  }, [timeRange]);

  const { data: stats, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: trends, isLoading: trendsLoading } = useGetTrendDataQuery({ days });
  const { data: funnel, isLoading: funnelLoading } = useGetFunnelDataQuery();
  const { data: alerts, isLoading: alertsLoading } = useGetAlertsDataQuery();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivityQuery();
  const { data: attention, isLoading: attentionLoading } = useGetAdminDashboardAttentionQuery();
  const { data: teamWorkload, isLoading: teamWorkloadLoading } = useGetAdminDashboardTeamWorkloadQuery();

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
    return stats.usersByRole.map((item: any) => ({
      name: item.role,
      value: item.count,
    }));
  }, [stats]);

  const roleTotal = useMemo(
    () => roleData.reduce((s: number, r: any) => s + r.value, 0),
    [roleData],
  );

  if (!user) return null;

  return (
    <div className="space-y-5 pb-6" dir="rtl">
      <PageIntro
        title="مركز القيادة"
        description={`مرحباً، ${user.name || "الإدارة"} — نظرة شاملة على أداء المنصة`}
        icon={LayoutDashboard}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
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
              icon={<BarChart3 className="w-4 h-4" />}
            >
              السجل
            </ActionButton>
          </div>
        }
      />

      {/* Row 1 — Hero KPIs | Needs Attention | Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DashboardCard title="المؤشرات الرئيسية" icon={BarChart3} showAll={false}>
          <HeroKpis stats={stats} isLoading={statsLoading} />
        </DashboardCard>
        <DashboardCard title="ما يحتاج اهتماماً" icon={AlertTriangle} showAll={false}>
          <NeedsAttentionCards data={attention} isLoading={attentionLoading} />
        </DashboardCard>
        <DashboardCard title="حالة الفريق" icon={Users} showAll={false}>
          <TeamWorkload data={teamWorkload} isLoading={teamWorkloadLoading} />
        </DashboardCard>
      </div>

      {/* Row 2 — Revenue Chart | Funnel | Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DashboardCard
          title="الإيرادات الشهرية"
          icon={TrendingUp}
          onShowAll={() => router.push("/dashboard/admin/finance")}
        >
          <div className="h-[300px]">
            <RevenueChart data={revenueData} isLoading={trendsLoading} />
          </div>
        </DashboardCard>
        <DashboardCard title="مسار التحويل" icon={Activity} showAll={false}>
          <FunnelCard funnel={funnel} isLoading={funnelLoading} />
        </DashboardCard>
        <DashboardCard title="إجراءات سريعة" icon={Settings} showAll={false}>
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

      {/* Row 3 — Users Chart | Role Distribution | Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DashboardCard
          title="المستخدمين والعملاء"
          icon={Users}
          onShowAll={() => router.push("/dashboard/admin/users")}
        >
          <div className="h-[300px]">
            <UsersBarChart data={usersBarData} isLoading={trendsLoading} />
          </div>
        </DashboardCard>
        <DashboardCard title="توزيع المستخدمين" icon={BarChart3} showAll={false}>
          <div className="h-[300px]">
            <RoleDistribution
              data={roleData}
              total={roleTotal}
              isLoading={statsLoading}
            />
          </div>
        </DashboardCard>
        <DashboardCard title="آخر النشاطات" icon={Activity} showAll={false}>
          <RecentActivityMerged
            activities={recentActivity}
            alerts={alerts}
            isLoading={activityLoading || alertsLoading}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
