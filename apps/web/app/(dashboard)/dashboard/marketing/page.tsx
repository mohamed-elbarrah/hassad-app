"use client";

import { useAppSelector } from "@/lib/hooks";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { AlertList } from "@/components/dashboard/marketing/AlertList";
import { CampaignPerformanceList } from "@/components/dashboard/marketing/CampaignPerformanceList";
import {
  useGetMyTasksQuery,
  useGetMyTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { useGetMyCampaignStatsQuery } from "@/features/marketing/marketingApi";
import { useGetMyNotificationsQuery } from "@/features/notifications/notificationsApi";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  daysUntil,
} from "@/lib/format";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/utils/task-status";
import {
  TaskStatus,
  TaskPriority,
  CampaignPlatform,
  CampaignStatus,
} from "@hassad/shared";
import Link from "next/link";
import {
  ClipboardList,
  Target,
  Wallet,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  TrendingUp,
  AlertTriangle,
  Bell,
  BarChart3,
  Megaphone,
  Calendar,
  MousePointerClick,
  FolderKanban,
} from "lucide-react";

import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_BADGE,
  PLATFORM_LABELS,
  PLATFORM_COLORS,
  PLATFORM_BG_COLORS,
} from "@/lib/utils/campaign-constants";

const NOTIFICATION_ICON_MAP: Record<string, React.ElementType> = {
  MARKETING_CAMPAIGN_CREATED: Megaphone,
  MARKETING_METRICS_UPDATED: BarChart3,
  MARKETING_CAMPAIGN_STATUS_CHANGED: Activity,
  MARKETING_OPTIMIZATION_REQUIRED: AlertTriangle,
  TASK_ASSIGNED: ClipboardList,
  TASK_STARTED: Zap,
  TASK_SUBMITTED: CheckCircle2,
  TASK_APPROVED: CheckCircle2,
  TASK_REJECTED: AlertTriangle,
  TASK_STATUS_CHANGED: ClipboardList,
  TASK_COMMENT: Activity,
  PROJECT_STATUS_CHANGED: FolderKanban,
};

const TASK_STATUS_MAP: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "PENDING",
  [TaskStatus.IN_PROGRESS]: "ACTIVE",
  [TaskStatus.IN_REVIEW]: "WARNING",
  [TaskStatus.REVISION]: "DANGER",
  [TaskStatus.DONE]: "COMPLETED",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketingDashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  const { data: tasks = [], isLoading: tasksLoading } = useGetMyTasksQuery(
    { deptName: "MARKETING", includeCampaigns: true },
    { pollingInterval: 30000 },
  );
  const { data: taskStats, isLoading: taskStatsLoading } =
    useGetMyTaskStatsQuery();
  const { data: campaignStats, isLoading: statsLoading } =
    useGetMyCampaignStatsQuery(undefined, { pollingInterval: 30000 });
  const { data: notificationsData, isLoading: notifsLoading } =
    useGetMyNotificationsQuery({ limit: 10, page: 1 });

  const notifications = notificationsData?.data || [];

  // ── Derived campaign data ──────────────────────────────────────────────
  const allCampaigns = tasks.flatMap((task: any) =>
    (task.campaigns || []).map((c: any) => {
      const snap = c.kpiSnapshots?.[0] || {};
      return {
        ...c,
        taskTitle: task.title,
        taskId: task.id,
        clientName: task.project?.client?.companyName,
        impressions: snap.impressions ?? 0,
        clicks: snap.clicks ?? 0,
        conversions: snap.conversions ?? 0,
        revenue: snap.revenue ?? 0,
        roas: snap.roas ?? 0,
        ctr: snap.ctr ?? 0,
        cpa: snap.cpa ?? 0,
        cpc: snap.cpc ?? 0,
      };
    }),
  );

  const activeCampaigns = allCampaigns.filter(
    (c) => c.status === CampaignStatus.ACTIVE,
  );
  const totalConversions = allCampaigns.reduce(
    (sum, c) => sum + (c.conversions || 0),
    0,
  );
  const totalBudgetTotal = allCampaigns.reduce(
    (sum, c) => sum + (c.budgetTotal || 0),
    0,
  );
  const budgetUtilization =
    totalBudgetTotal > 0
      ? Math.round(
          (allCampaigns.reduce((sum, c) => sum + (c.budgetSpent || 0), 0) /
            totalBudgetTotal) *
            100,
        )
      : 0;

  // ── Platform distribution ──────────────────────────────────────────────
  const platformDistribution = Object.values(CampaignPlatform)
    .map((platform) => {
      const platformCampaigns = allCampaigns.filter(
        (c) => c.platform === platform,
      );
      const spend = platformCampaigns.reduce(
        (sum, c) => sum + (c.budgetSpent || 0),
        0,
      );
      const total = platformCampaigns.reduce(
        (sum, c) => sum + (c.budgetTotal || 0),
        0,
      );
      return {
        platform,
        label: PLATFORM_LABELS[platform] || platform,
        spend,
        total,
        count: platformCampaigns.length,
      };
    })
    .filter((p) => p.count > 0);

  const platformTotalSpend = platformDistribution.reduce(
    (s, p) => s + p.spend,
    0,
  );

  // ── Task breakdown ───────────────────────────────────────────────────────
  const overdueTasks = tasks.filter((t: any) => {
    const days = daysUntil(t.dueDate);
    return days !== null && days < 0 && t.status !== TaskStatus.DONE;
  });

  const urgentTasks = tasks.filter(
    (t: any) =>
      (t.priority === TaskPriority.HIGH ||
        t.priority === TaskPriority.URGENT) &&
      t.status !== TaskStatus.DONE,
  );

  const isLoading =
    tasksLoading || statsLoading || taskStatsLoading || notifsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 pb-10" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            لوحة تحكم التسويق
          </h1>
          <p className="text-neutral-300 mt-2">
            مرحباً {user?.name}، إليك ملخص أداء حملاتك ومهامك الحالية.
          </p>
        </div>
        <ActionButton
          href="/dashboard/marketing/tasks"
          variant="outline"
          className="gap-2"
        >
          <ClipboardList className="w-4 h-4" />
          عرض المهام المسندة
        </ActionButton>
      </div>

      {/* ── Stats Overview ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="المهام النشطة"
          value={taskStats?.inProgress ?? 0}
          icon={Zap}
          variant="default"
          trend="neutral"
          trendValue={`${taskStats?.todo ?? 0} للتنفيذ`}
        />
        <StatCard
          title="الحملات النشطة"
          value={campaignStats?.activeCampaigns ?? 0}
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="إجمالي الإنفاق"
          value={formatCurrency(campaignStats?.totalBudgetUsed)}
          icon={Wallet}
          variant="warning"
          trend={budgetUtilization > 90 ? "down" : "neutral"}
          trendValue={`${budgetUtilization}% من الميزانية`}
        />
        <StatCard
          title="متوسط ROAS"
          value={
            campaignStats?.avgRoas != null
              ? `${Number(campaignStats.avgRoas).toFixed(1)}x`
              : "—"
          }
          icon={Target}
          variant="default"
          trend="up"
          trendValue="عائد على الإنفاق"
        />
        <StatCard
          title="التحويلات"
          value={formatNumber(totalConversions)}
          icon={MousePointerClick}
          variant="default"
        />
        <StatCard
          title="مهام متأخرة"
          value={taskStats?.overdue ?? 0}
          icon={AlertTriangle}
          variant={(taskStats?.overdue ?? 0) > 0 ? "danger" : "default"}
          trend={(taskStats?.overdue ?? 0) > 0 ? "down" : "neutral"}
          trendValue={
            (taskStats?.overdue ?? 0) > 0 ? "تحتاج متابعة" : "لا يوجد"
          }
        />
      </div>

      {/* ── Critical Alerts ────────────────────────────────────────────── */}
      <AlertList tasks={tasks as any[]} />

      {/* ── Main Content Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Campaign Performance */}
          <SurfaceCard
            title="أداء الحملات"
            description="نظرة سريعة على أداء الحملات المرتبطة بمهامك"
            icon={BarChart3}
            action={
              <Link
                href="/dashboard/marketing/tasks"
                className="text-sm text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
              >
                عرض الكل
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            }
          >
            {allCampaigns.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="لا توجد حملات"
                description="لم يتم إنشاء أي حملة مرتبطة بمهامك بعد."
              />
            ) : (
              <CampaignPerformanceList campaigns={allCampaigns} />
            )}
          </SurfaceCard>

          {/* Tasks Overview */}
          <SurfaceCard
            title="مهامي التسويقية"
            description="المهام المسندة إليك وحالة التنفيذ"
            icon={ClipboardList}
            action={
              <Link
                href="/dashboard/marketing/tasks"
                className="text-sm text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
              >
                عرض الكل
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            }
          >
            {tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="لا توجد مهام"
                description="لم يتم إسناد أي مهمة تسويقية إليك بعد."
              />
            ) : (
              <div className="space-y-3">
                {/* Overdue/Urgent first */}
                {[...overdueTasks, ...urgentTasks]
                  .filter(
                    (task, index, self) =>
                      index === self.findIndex((t: any) => t.id === task.id),
                  )
                  .slice(0, 3)
                  .map((task: any) => (
                    <TaskRow key={task.id} task={task} variant="urgent" />
                  ))}

                {/* Regular tasks */}
                {tasks
                  .filter(
                    (t: any) =>
                      t.status !== TaskStatus.DONE &&
                      !overdueTasks.some((o: any) => o.id === t.id) &&
                      !urgentTasks.some((u: any) => u.id === t.id),
                  )
                  .slice(0, 5)
                  .map((task: any) => (
                    <TaskRow key={task.id} task={task} />
                  ))}

                {tasks.filter((t: any) => t.status !== TaskStatus.DONE).length >
                  8 && (
                  <Link
                    href="/dashboard/marketing/tasks"
                    className="flex items-center justify-center p-3 text-sm text-secondary-500 hover:text-secondary-600 font-medium"
                  >
                    عرض جميع المهام
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  </Link>
                )}
              </div>
            )}
          </SurfaceCard>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          {/* Platform Distribution */}
          <SurfaceCard
            title="توزيع المنصات"
            description="الإنفاق حسب المنصة الإعلانية"
            icon={TrendingUp}
          >
            {platformDistribution.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="لا توجد بيانات"
                description="لم يتم إنشاء حملات بعد."
              />
            ) : (
              <div className="space-y-5">
                {platformDistribution.map((p) => {
                  const percentage =
                    platformTotalSpend > 0
                      ? Math.round((p.spend / platformTotalSpend) * 100)
                      : 0;
                  return (
                    <div key={p.platform} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{p.label}</span>
                        <span className="text-neutral-300">
                          {formatCurrency(p.spend)} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-neutral-50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              PLATFORM_COLORS[p.platform] || "#6B7280",
                          }}
                        />
                      </div>
                      <p className="text-xs text-neutral-300">
                        {p.count} حملة · {formatCurrency(p.total)} ميزانية
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SurfaceCard>

          {/* Budget Utilization */}
          <SurfaceCard
            title="استهلاك الميزانية"
            description="نسبة الإنفاق للحملات النشطة"
            icon={Wallet}
          >
            {activeCampaigns.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="لا توجد حملات نشطة"
                description="لا توجد حملات نشطة حالياً."
              />
            ) : (
              <div className="space-y-5">
                {activeCampaigns
                  .sort(
                    (a, b) =>
                      b.budgetSpent / Math.max(b.budgetTotal, 1) -
                      a.budgetSpent / Math.max(a.budgetTotal, 1),
                  )
                  .slice(0, 5)
                  .map((c) => {
                    const pct = Math.min(
                      100,
                      Math.round(
                        (c.budgetSpent / Math.max(c.budgetTotal, 1)) * 100,
                      ),
                    );
                    return (
                      <div key={c.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate max-w-[140px]">
                            {c.name}
                          </span>
                          <span className="text-xs text-neutral-300">
                            {formatCurrency(c.budgetSpent)} /{" "}
                            {formatCurrency(c.budgetTotal)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-50 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct > 90
                                ? "bg-danger-500"
                                : pct > 70
                                  ? "bg-alert-500"
                                  : "bg-success-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-neutral-300 text-left">
                          {pct}%
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </SurfaceCard>

          {/* Recent Activity */}
          <SurfaceCard
            title="آخر النشاطات"
            icon={Bell}
            action={
              <Link
                href="/dashboard/notifications"
                className="text-sm text-secondary-500 hover:text-secondary-600"
              >
                عرض الكل
              </Link>
            }
          >
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-300">لا توجد نشاطات حديثة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 6).map((notif: any, i: number) => {
                  const NotifIcon =
                    NOTIFICATION_ICON_MAP[notif.eventType] ?? Bell;
                  return (
                    <div key={notif.id || i} className="flex gap-3 relative">
                      {i < Math.min(notifications.length, 6) - 1 && (
                        <div className="absolute right-[17px] top-8 bottom-0 w-px bg-portal-divider" />
                      )}
                      <div className="w-9 h-9 rounded-full bg-secondary-500/10 flex items-center justify-center shrink-0">
                        <NotifIcon className="w-4 h-4 text-secondary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{notif.title}</span>
                        </p>
                        <p className="text-xs text-neutral-300 mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-[11px] text-neutral-300 mt-1">
                          {formatRelativeTime(notif.createdAt as string)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TaskRow({ task, variant }: { task: any; variant?: "urgent" }) {
  const days = daysUntil(task.dueDate);
  const isOverdue = days !== null && days < 0;
  const campaignCount = (task.campaigns || []).length;

  return (
    <Link
      href={`/dashboard/marketing/tasks/${task.id}`}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${
        variant === "urgent"
          ? "border-danger-200 bg-danger-50/30 hover:shadow-md"
          : "border-portal-card-border hover:border-secondary-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            variant === "urgent"
              ? "bg-danger-100 text-danger-600"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4 className="font-medium group-hover:text-secondary-500 transition-colors truncate">
            {task.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-300 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate)}
              {isOverdue && (
                <span className="text-danger-600 font-medium">
                  (متأخرة {Math.abs(days)} يوم)
                </span>
              )}
              {!isOverdue && days !== null && days <= 3 && (
                <span className="text-alert-600 font-medium">
                  (متبقي {days} يوم)
                </span>
              )}
            </span>
            {campaignCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Megaphone className="w-3 h-3" />
                  {campaignCount} حملة
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 mr-2">
        <StatusBadge
          status={TASK_STATUS_MAP[task.status as TaskStatus]}
          label={TASK_STATUS_LABELS[task.status as TaskStatus]}
          className="text-xs"
        />
        {task.priority !== TaskPriority.LOW &&
          task.priority !== TaskPriority.NORMAL && (
            <StatusBadge
              status={
                task.priority === TaskPriority.URGENT ? "DANGER" : "WARNING"
              }
              label={TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
              className="text-xs"
            />
          )}
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[30px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[320px] rounded-[30px]" />
          <Skeleton className="h-[280px] rounded-[30px]" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-[260px] rounded-[30px]" />
          <Skeleton className="h-[240px] rounded-[30px]" />
          <Skeleton className="h-[200px] rounded-[30px]" />
        </div>
      </div>
    </div>
  );
}
