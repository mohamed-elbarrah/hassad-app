"use client";

import { useAppSelector } from "@/lib/hooks";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import {
  useGetPmTasksQuery,
  useGetPmTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { useGetMyNotificationsQuery } from "@/features/notifications/notificationsApi";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton } from "@/components/design-system/Skeleton";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { MetricCard } from "@/components/design-system/MetricCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { TableCell } from "@/components/design-system/Primitives";
import { PmEmptyState } from "@/components/dashboard/pm/shared/PmEmptyState";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import { formatShortDate, formatRelativeTime } from "@/lib/format";
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  TASK_PRIORITY_AR,
} from "@hassad/shared";
import type { TaskWithProject } from "@/features/tasks/tasksApi";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLOR,
} from "@/lib/utils/project-status";
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
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ── Status Config ────────────────────────────────────────────────────────────

const PROJECT_STATUS_AR = PROJECT_STATUS_LABELS;

const TASK_PRIORITY_LABELS = TASK_PRIORITY_AR;

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

// ── Status color map (canonical, same as kanban board) ─────────────────────
const PROJECT_STATUS_BG: Record<string, string> = PROJECT_STATUS_COLOR;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PMWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [taskFilter, setTaskFilter] = useState<"all" | "urgent" | "overdue">(
    "all",
  );

  // ── Real data from backend ───────────────────────────────────────────
  const { data: projectsData, isLoading: projectsLoading } =
    useGetProjectsQuery({
      limit: 100,
      projectManagerId: user?.role === "PM" ? user.id : undefined,
    });

  const { data: pmTasks = [], isLoading: tasksLoading } = useGetPmTasksQuery(
    {},
  );

  const { data: pmStats, isLoading: statsLoading } = useGetPmTaskStatsQuery();

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

  // Overdue tasks
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

  // Combined unique tasks for the attention section
  const allAttentionTasks = [...urgentTasks, ...overdueTasks].filter(
    (task, index, self) => index === self.findIndex((t) => t.id === task.id),
  );

  // Filtered tasks based on active tab
  const filteredAttentionTasks = (() => {
    if (taskFilter === "urgent") {
      return allAttentionTasks.filter(
        (t) =>
          t.priority === TaskPriority.URGENT ||
          t.priority === TaskPriority.HIGH,
      );
    }
    if (taskFilter === "overdue") {
      return allAttentionTasks.filter((t) => {
        const due = new Date(t.dueDate);
        return due < new Date() && t.status !== TaskStatus.DONE;
      });
    }
    return allAttentionTasks;
  })().slice(0, 5);

  // Project status breakdown
  const projectStatusCounts = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalProjects = projects.length;

  const isLoading =
    projectsLoading || tasksLoading || statsLoading || notifsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page-shell" dir="rtl">
      {/* ── Header Section ─────────────────────────────────────────────── */}
      <PageIntro
        title="لوحة تحكم مدير المشاريع"
        description={`مرحباً ${user?.name}، إليك نظرة شاملة على مشاريعك ومهام فريقك.`}
        icon={LayoutDashboard}
        actions={
          <>
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
          </>
        }
      />

      {/* ── Stats Overview ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="المشاريع النشطة"
          value={activeProjects}
          icon={FolderKanban}
          variant="default"
          trend="neutral"
          trendValue={`${completedProjects} مكتملة`}
        />
        <MetricCard
          title="المهام قيد التنفيذ"
          value={pmStats?.inProgress ?? 0}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="بانتظار المراجعة"
          value={pmStats?.inReview ?? 0}
          icon={Inbox}
          variant="default"
        />
        <MetricCard
          title="مهام متأخرة"
          value={pmStats?.overdue ?? 0}
          icon={AlertTriangle}
          variant={(pmStats?.overdue ?? 0) > 0 ? "danger" : "default"}
          trend={(pmStats?.overdue ?? 0) > 0 ? "down" : "neutral"}
          trendValue={(pmStats?.overdue ?? 0) > 0 ? "تحتاج متابعة" : "لا يوجد"}
        />
      </div>

      {/* ── Main Content Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Projects & Tasks (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Projects Overview Section */}
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
            {totalProjects > 0 ? (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {Object.entries(PROJECT_STATUS_AR).map(([status, label]) => {
                  const count = projectStatusCounts[status] || 0;
                  if (count === 0) return null;
                  const color = PROJECT_STATUS_BG[status] || "#94A3B8";
                  return (
                    <div
                      key={status}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${color}15`,
                        color: color,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>{label}</span>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-6">
                <PmEmptyState
                  icon={FolderKanban}
                  title="لا توجد مشاريع"
                  description="لم يتم تعيين أي مشروع لك بعد."
                />
              </div>
            )}

            {/* Recent Projects */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-portal-note-text mb-3">
                المشاريع الحديثة
              </h3>
              <RecentProjectsTable
                projects={projects.slice(0, 10)}
                totalProjects={totalProjects}
              />
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
              allAttentionTasks.length > 0
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
            {/* Filter Tabs */}
            {allAttentionTasks.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                    taskFilter === "all"
                      ? "bg-secondary-500 text-white shadow-sm"
                      : "bg-badge-gray-bg text-portal-note-text hover:bg-badge-gray-bg/80",
                  )}
                >
                  الكل ({allAttentionTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter("urgent")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                    taskFilter === "urgent"
                      ? "bg-alert-500 text-white shadow-sm"
                      : "bg-badge-gray-bg text-portal-note-text hover:bg-badge-gray-bg/80",
                  )}
                >
                  عاجل ({urgentTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter("overdue")}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-colors font-medium",
                    taskFilter === "overdue"
                      ? "bg-danger-500 text-white shadow-sm"
                      : "bg-badge-gray-bg text-portal-note-text hover:bg-badge-gray-bg/80",
                  )}
                >
                  متأخر ({overdueTasks.length})
                </button>
              </div>
            )}

            {filteredAttentionTasks.length === 0 ? (
              <PmEmptyState
                icon={CheckCircle2}
                title="لا توجد مهام عاجلة"
                description="جميع مهام مشاريعك تحت السيطرة."
              />
            ) : (
              <div className="space-y-3">
                {filteredAttentionTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/pm/tasks/${task.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-portal-card-border hover:border-secondary-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          task.priority === TaskPriority.URGENT
                            ? "bg-danger-100 text-danger-600"
                            : task.priority === TaskPriority.HIGH
                              ? "bg-alert-100 text-alert-600"
                              : "bg-badge-gray-bg text-portal-note-text",
                        )}
                      >
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-natural-100 group-hover:text-secondary-500 transition-colors truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-portal-note-text flex-wrap">
                          <span className="truncate max-w-[120px]">
                            {task.project?.name}
                          </span>
                          {task.assignee?.name && (
                            <>
                              <span className="shrink-0">•</span>
                              <span className="flex items-center gap-1 shrink-0">
                                <User className="w-3 h-3" />
                                {task.assignee.name}
                              </span>
                            </>
                          )}
                          <span className="shrink-0">•</span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            {formatShortDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mr-3">
                      <PmStatusBadge
                        domain="task"
                        status={task.status}
                        className="text-xs"
                      />
                      {task.priority !== TaskPriority.LOW &&
                        task.priority !== TaskPriority.NORMAL && (
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              task.priority === TaskPriority.URGENT
                                ? "bg-danger-100 text-danger-600"
                                : "bg-alert-100 text-alert-600",
                            )}
                          >
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                        )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>

        {/* Right Column - Stats & Activity (1/3) */}
        <div className="space-y-5">
          {/* Task Progress */}
          <SurfaceCard title="إحصائيات المهام" icon={TrendingUp}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-portal-divider">
                <span className="text-sm text-portal-note-text">
                  إجمالي المهام
                </span>
                <span className="text-2xl font-semibold text-natural-100">
                  {pmStats?.total ?? 0}
                </span>
              </div>
              <div className="space-y-3">
                <TaskStatRow
                  label="للتنفيذ"
                  value={pmStats?.todo ?? 0}
                  color="bg-portal-note-text"
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
                  color="bg-secondary-500"
                  max={pmStats?.total ?? 0}
                />
                <TaskStatRow
                  label="منجزة"
                  value={pmStats?.done ?? 0}
                  color="bg-success-500"
                  max={pmStats?.total ?? 0}
                />
              </div>
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
                <Bell className="w-8 h-8 text-portal-note-text mx-auto mb-3" />
                <p className="text-sm text-portal-note-text">
                  لا توجد نشاطات حديثة
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 6).map((notif, i) => {
                  const NotifIcon =
                    NOTIFICATION_ICON_MAP[(notif as any).eventType] ?? Bell;
                  return (
                    <div key={notif.id || i} className="flex gap-3 relative">
                      {i < Math.min(notifications.length, 6) - 1 && (
                        <div className="absolute right-[17px] top-8 bottom-0 w-px bg-portal-divider" />
                      )}
                      <div className="w-9 h-9 rounded-full bg-secondary-500/10 flex items-center justify-center shrink-0">
                        <NotifIcon className="w-4 h-4 text-secondary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate text-natural-100">
                          <span className="font-medium">{notif.title}</span>
                        </p>
                        <p className="text-xs text-portal-note-text mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-[11px] text-portal-note-text mt-1">
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
    <div className="page-shell" dir="rtl">
      {/* PageIntro skeleton */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[30px]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
        <span className="text-portal-note-text">{label}</span>
        <span className="font-medium text-natural-100">{value}</span>
      </div>
      {max !== undefined && (
        <div className="h-2 rounded-full bg-badge-gray-bg overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── Recent Projects Table ────────────────────────────────────────────────────

const PROJECT_TABLE_COLUMNS: DataTableColumn[] = [
  { id: "name", label: "المشروع", align: "left" },
  { id: "status", label: "الحالة", align: "center", width: "120px" },
  { id: "progress", label: "التقدم", align: "center", width: "140px" },
  { id: "duration", label: "المدة", align: "center", width: "200px" },
  { id: "manager", label: "مدير المشروع", align: "left", width: "140px" },
];

const PROJECT_TABLE_EMPTY: DataTableEmptyState = {
  icon: FolderKanban,
  message: "لا توجد مشاريع",
  hint: "لم يتم تعيين أي مشروع لك بعد.",
};

function RecentProjectsTable({
  projects,
  totalProjects,
}: {
  projects: any[];
  totalProjects: number;
}) {
  const router = useRouter();

  return (
    <DataTable
      columns={PROJECT_TABLE_COLUMNS}
      data={projects}
      isLoading={false}
      isError={false}
      emptyState={PROJECT_TABLE_EMPTY}
      onRowActivate={(project: any) =>
        router.push(`/dashboard/pm/projects/${project.id}`)
      }
      renderCells={(project: any) => {
        const progress = Math.round(
          project.progress ?? project.completionPercentage ?? 0,
        );
        return [
          // ── Project name + client ──
          <TableCell key="name" className="px-5 py-4">
            <div className="flex flex-col">
              <span className="font-medium text-natural-100 group-hover:text-secondary-500 transition-colors">
                {project.name}
              </span>
              {project.client?.companyName && (
                <span className="text-xs text-portal-note-text mt-0.5">
                  {project.client.companyName}
                </span>
              )}
            </div>
          </TableCell>,
          // ── Status badge ──
          <TableCell key="status" className="px-5 py-4 text-center">
            <PmStatusBadge
              domain="project"
              status={project.status}
              className="text-xs"
            />
          </TableCell>,
          // ── Progress bar ──
          <TableCell key="progress" className="px-5 py-4">
            <div className="flex items-center gap-2">
              <ProgressBar value={progress} size="sm" className="flex-1" />
              <span className="text-xs text-portal-note-text w-8 text-left shrink-0">
                {progress}%
              </span>
            </div>
          </TableCell>,
          // ── Date range ──
          <TableCell key="duration" className="px-5 py-4 text-center">
            <span className="text-sm text-portal-note-text">
              {formatShortDate(project.startDate)} —{" "}
              {formatShortDate(project.endDate)}
            </span>
          </TableCell>,
          // ── Manager ──
          <TableCell key="manager" className="px-5 py-4">
            <span className="text-sm text-natural-100">
              {project.manager?.name || "—"}
            </span>
          </TableCell>,
        ];
      }}
    />
  );
}
