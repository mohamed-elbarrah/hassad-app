"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import {
  useGetPmTasksQuery,
  useGetPmTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { useGetMyNotificationsQuery } from "@/features/notifications/notificationsApi";
import { ProjectCard } from "@/components/dashboard/pm/ProjectCard";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatCard } from "@/components/design-system/StatCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatShortDate, formatRelativeTime } from "@/lib/format";
import { ProjectStatus, TaskStatus, TaskPriority } from "@hassad/shared";
import type { TaskWithProject } from "@/features/tasks/tasksApi";
import type { Notification } from "@hassad/shared";
import {
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ClipboardList,
  Bell,
  Calendar,
  AlertTriangle,
  Inbox,
  BarChart3,
  User,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

// ── Status Config ────────────────────────────────────────────────────────────

const PROJECT_STATUS_AR: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "تخطيط",
  [ProjectStatus.ACTIVE]: "نشط",
  [ProjectStatus.ON_HOLD]: "معلق",
  [ProjectStatus.AWAITING_REVIEW]: "بانتظار المراجعة",
  [ProjectStatus.NEEDS_REVISION]: "يحتاج تعديل",
  [ProjectStatus.COMPLETED]: "مكتمل",
  [ProjectStatus.CANCELLED]: "ملغى",
};

const TASK_STATUS_AR: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "للتنفيذ",
  [TaskStatus.IN_PROGRESS]: "قيد التنفيذ",
  [TaskStatus.IN_REVIEW]: "قيد المراجعة",
  [TaskStatus.REVISION]: "يحتاج تعديل",
  [TaskStatus.DONE]: "منجز",
};

const TASK_PRIORITY_AR: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

const PRIORITY_STATUS_MAP: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "PENDING",
  [TaskPriority.NORMAL]: "PENDING",
  [TaskPriority.HIGH]: "WARNING",
  [TaskPriority.URGENT]: "DANGER",
};

const TASK_STATUS_MAP: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "PENDING",
  [TaskStatus.IN_PROGRESS]: "ACTIVE",
  [TaskStatus.IN_REVIEW]: "WARNING",
  [TaskStatus.REVISION]: "DANGER",
  [TaskStatus.DONE]: "COMPLETED",
};

const NOTIFICATION_ICON_MAP: Record<string, React.ElementType> = {
  TASK_ASSIGNED: ClipboardList,
  TASK_STARTED: ClipboardList,
  TASK_SUBMITTED: ClipboardList,
  TASK_APPROVED: CheckCircle2,
  TASK_REJECTED: AlertCircle,
  TASK_STATUS_CHANGED: ClipboardList,
  TASK_COMMENT: MessageSquare,
  PROJECT_STATUS_CHANGED: FolderKanban,
  PROJECT_CREATED: FolderKanban,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PMWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);

  // ── Real data from backend ───────────────────────────────────────────
  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useGetProjectsQuery({
    limit: 100,
    projectManagerId: user?.role === "PM" ? user.id : undefined,
  });

  const { data: pmTasks = [], isLoading: tasksLoading } =
    useGetPmTasksQuery({});

  const { data: pmStats, isLoading: statsLoading } =
    useGetPmTaskStatsQuery();

  const { data: notificationsData, isLoading: notifsLoading } =
    useGetMyNotificationsQuery({ limit: 10 });

  const projects = projectsData?.items || [];
  const notifications = notificationsData?.data || [];

  // ── Derived data ─────────────────────────────────────────────────────
  const activeProjects = projects.filter(
    (p) =>
      p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.PLANNING,
  ).length;

  const completedProjects = projects.filter(
    (p) => p.status === ProjectStatus.COMPLETED,
  ).length;

  // Overdue tasks: from PM tasks (all tasks in PM's projects)
  const overdueTasks = (pmTasks as TaskWithProject[]).filter((t) => {
    const due = new Date(t.dueDate);
    return due < new Date() && t.status !== TaskStatus.DONE;
  });

  // Urgent + high priority tasks (not done)
  const urgentTasks = (pmTasks as TaskWithProject[])
    .filter(
      (t) =>
        (t.priority === TaskPriority.URGENT ||
          t.priority === TaskPriority.HIGH) &&
        t.status !== TaskStatus.DONE,
    )
    .slice(0, 5);

  // Project status breakdown
  const projectStatusCounts = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const isLoading = projectsLoading || tasksLoading || statsLoading || notifsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 pb-10" dir="rtl">
      {/* ── Header Section ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            لوحة تحكم مدير المشاريع
          </h1>
          <p className="text-neutral-300 mt-2">
            مرحباً {user?.name}، إليك نظرة شاملة على مشاريعك ومهام فريقك.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton
            href="/dashboard/pm/projects"
            variant="outline"
            className="gap-2"
          >
            <FolderKanban className="w-4 h-4" />
            عرض المشاريع
          </ActionButton>
          <ActionButton href="/dashboard/pm/tasks" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            إدارة المهام
          </ActionButton>
        </div>
      </div>

      {/* ── Stats Overview ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="المشاريع النشطة"
          value={activeProjects}
          icon={FolderKanban}
          variant="default"
          trend="neutral"
          trendValue={`${completedProjects} مكتملة`}
        />
        <StatCard
          title="المهام قيد التنفيذ"
          value={pmStats?.inProgress ?? 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="بانتظار المراجعة"
          value={pmStats?.inReview ?? 0}
          icon={Inbox}
          variant="default"
        />
        <StatCard
          title="مهام متأخرة"
          value={pmStats?.overdue ?? 0}
          icon={AlertTriangle}
          variant={(pmStats?.overdue ?? 0) > 0 ? "danger" : "default"}
          trend={(pmStats?.overdue ?? 0) > 0 ? "down" : "neutral"}
          trendValue={
            (pmStats?.overdue ?? 0) > 0 ? "تحتاج متابعة" : "لا يوجد"
          }
        />
      </div>

      {/* ── Main Content Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Projects & Tasks (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Projects Section */}
          <SurfaceCard
            title="حالة المشاريع"
            description="نظرة عامة على المشاريع تحت إدارتك"
            icon={BarChart3}
            action={
              <Link
                href="/dashboard/pm/projects"
                className="text-sm text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
              >
                عرض الكل
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            }
          >
            {/* Project Status Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {Object.entries(PROJECT_STATUS_AR).map(([status, label]) => {
                const count = projectStatusCounts[status] || 0;
                if (count === 0) return null;
                return (
                  <div
                    key={status}
                    className="text-center p-3 rounded-xl bg-neutral-50/50"
                  >
                    <p className="text-2xl font-semibold text-natural-100">
                      {count}
                    </p>
                    <p className="text-xs text-neutral-300 mt-1">{label}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Projects */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-300 mb-3">
                المشاريع الحديثة
              </h3>
              {projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="لا توجد مشاريع"
                  description="لم يتم تعيين أي مشروع لك بعد."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.slice(0, 4).map((project) => (
                    <ProjectCard key={project.id} project={project as any} />
                  ))}
                </div>
              )}
              {projects.length > 4 && (
                <Link
                  href="/dashboard/pm/projects"
                  className="flex items-center justify-center p-3 text-sm text-secondary-500 hover:text-secondary-600 font-medium mt-4"
                >
                  عرض جميع المشاريع ({projects.length})
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                </Link>
              )}
            </div>
          </SurfaceCard>

          {/* Tasks Requiring Attention */}
          <SurfaceCard
            title="مهام تتطلب المتابعة"
            description={
              urgentTasks.length > 0
                ? "مهام ذات أولوية عالية أو متأخرة في مشاريعك"
                : "لا توجد مهام عاجلة"
            }
            icon={ClipboardList}
            action={
              <Link
                href="/dashboard/pm/tasks"
                className="text-sm text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
              >
                عرض الكل
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            }
          >
            {urgentTasks.length === 0 && overdueTasks.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="لا توجد مهام عاجلة"
                description="جميع مهام مشاريعك تحت السيطرة."
              />
            ) : (
              <div className="space-y-3">
                {[...urgentTasks, ...overdueTasks]
                  .filter(
                    (task, index, self) =>
                      index === self.findIndex((t) => t.id === task.id),
                  )
                  .slice(0, 5)
                  .map((task) => (
                    <Link
                      key={task.id}
                      href={`/dashboard/pm/tasks/${task.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-portal-card-border hover:border-secondary-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            task.priority === TaskPriority.URGENT
                              ? "bg-danger-100 text-danger-600"
                              : task.priority === TaskPriority.HIGH
                                ? "bg-alert-100 text-alert-600"
                                : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium group-hover:text-secondary-500 transition-colors">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-300">
                            <span>{task.project?.name}</span>
                            {task.assignee?.name && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {task.assignee.name}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatShortDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={TASK_STATUS_MAP[task.status as TaskStatus]}
                          label={TASK_STATUS_AR[task.status as TaskStatus]}
                          className="text-xs"
                        />
                        {task.priority !== TaskPriority.LOW &&
                          task.priority !== TaskPriority.NORMAL && (
                            <StatusBadge
                              status={
                                PRIORITY_STATUS_MAP[task.priority as TaskPriority]
                              }
                              label={TASK_PRIORITY_AR[task.priority as TaskPriority]}
                              className="text-xs"
                            />
                          )}
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </SurfaceCard>
        </div>

        {/* Right Column - Alerts, Stats & Activity (1/3) */}
        <div className="space-y-8">
          {/* Priority Alerts */}
          {overdueTasks.length > 0 && (
            <SurfaceCard
              className="border-danger-200 bg-danger-50/30"
              icon={AlertCircle}
              title="تنبيهات عاجلة"
              description={`${pmStats?.overdue ?? overdueTasks.length} مهمة متأخرة`}
            >
              <div className="space-y-3">
                {overdueTasks.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/pm/tasks/${task.id}`}
                    className="flex items-start gap-3 p-3 bg-white rounded-xl border border-danger-100 hover:shadow-md transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-danger-100 text-danger-600 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm group-hover:text-secondary-500 transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-xs text-neutral-300 mt-1">
                        {task.project?.name}
                        {task.assignee?.name ? ` • ${task.assignee.name}` : ""}
                        {" • متأخرة بـ "}
                        {Math.abs(
                          Math.ceil(
                            (new Date().getTime() - new Date(task.dueDate).getTime()) /
                              (1000 * 60 * 60 * 24),
                          ),
                        )}
                        {" يوم"}
                      </p>
                    </div>
                  </Link>
                ))}
                {overdueTasks.length > 3 && (
                  <Link
                    href="/dashboard/pm/tasks"
                    className="flex items-center justify-center p-2 text-sm text-secondary-500 hover:text-secondary-600 font-medium"
                  >
                    عرض الكل ({pmStats?.overdue ?? overdueTasks.length})
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  </Link>
                )}
              </div>
            </SurfaceCard>
          )}

          {/* Task Stats */}
          <SurfaceCard title="إحصائيات المهام" icon={TrendingUp}>
            <div className="space-y-4">
              <TaskStatRow
                label="إجمالي المهام"
                value={pmStats?.total ?? 0}
                color="bg-secondary-500"
              />
              <TaskStatRow
                label="للتنفيذ"
                value={pmStats?.todo ?? 0}
                color="bg-neutral-300"
                max={pmStats?.total ?? 0}
              />
              <TaskStatRow
                label="قيد التنفيذ"
                value={pmStats?.inProgress ?? 0}
                color="bg-alert-500"
                max={pmStats?.total ?? 0}
              />
              <TaskStatRow
                label="قيد المراجعة"
                value={pmStats?.inReview ?? 0}
                color="bg-primary-500"
                max={pmStats?.total ?? 0}
              />
              <TaskStatRow
                label="منجزة"
                value={pmStats?.done ?? 0}
                color="bg-success-500"
                max={pmStats?.total ?? 0}
              />
            </div>
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
                <p className="text-sm text-neutral-300">
                  لا توجد نشاطات حديثة
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 6).map((notif, i) => {
                  const NotifIcon =
                    NOTIFICATION_ICON_MAP[(notif as any).eventType] ?? Bell;
                  return (
                    <div
                      key={notif.id || i}
                      className="flex gap-3 relative"
                    >
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

// ── Sub-components ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-10" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[30px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-96 rounded-[30px]" />
        <Skeleton className="h-96 rounded-[30px]" />
      </div>
    </div>
  );
}

function TaskStatRow({
  label,
  value,
  color,
  max,
}: {
  label: string;
  value: number;
  color: string;
  max?: number;
}) {
  const percentage = max && max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-300">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      {max !== undefined && (
        <div className="h-2 rounded-full bg-neutral-50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}