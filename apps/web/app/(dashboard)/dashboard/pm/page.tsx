"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  User,
} from "lucide-react";
import {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  TASK_PRIORITY_AR,
} from "@hassad/shared";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import { useGetMyNotificationsQuery } from "@/features/notifications/notificationsApi";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import {
  type TaskWithProject,
  useGetPmTasksQuery,
  useGetPmTaskStatsQuery,
} from "@/features/tasks/tasksApi";
import { formatRelativeTime, formatShortDate } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import { PROJECT_STATUS_LABELS } from "@/lib/utils/project-status";

const NOTIFICATION_ICON_MAP: Record<string, React.ElementType> = {
  TASK_ASSIGNED: ClipboardList,
  TASK_STARTED: ClipboardList,
  TASK_SUBMITTED: ClipboardList,
  TASK_APPROVED: CheckCircle2,
  TASK_REJECTED: AlertTriangle,
  TASK_STATUS_CHANGED: ClipboardList,
  TASK_COMMENT: MessageSquare,
  PROJECT_STATUS_CHANGED: FolderKanban,
  PROJECT_CREATED: FolderKanban,
};

type TaskFilter = "all" | "urgent" | "overdue";

export default function PMWorkspacePage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const { data: projectsData, isLoading: projectsLoading } =
    useGetProjectsQuery({
      limit: 100,
      projectManagerId: user?.role === "PM" ? user.id : undefined,
    });
  const { data: pmTasks = [], isLoading: tasksLoading } = useGetPmTasksQuery(
    {},
  );
  const { data: pmStats, isLoading: statsLoading } = useGetPmTaskStatsQuery();
  const { data: notificationsData, isLoading: notificationsLoading } =
    useGetMyNotificationsQuery({ limit: 10 });

  const projects = projectsData?.items || [];
  const tasks = pmTasks as TaskWithProject[];
  const notifications = notificationsData?.data || [];
  const activeProjects = projects.filter(
    (project) =>
      project.status === ProjectStatus.ACTIVE ||
      project.status === ProjectStatus.PLANNING,
  ).length;
  const completedProjects = projects.filter(
    (project) => project.status === ProjectStatus.COMPLETED,
  ).length;
  const overdueTasks = tasks.filter(
    (task) =>
      new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE,
  );
  const urgentTasks = tasks.filter(
    (task) =>
      (task.priority === TaskPriority.URGENT ||
        task.priority === TaskPriority.HIGH) &&
      task.status !== TaskStatus.DONE,
  );
  const attentionTasks = [...urgentTasks, ...overdueTasks].filter(
    (task, index, items) =>
      index === items.findIndex((candidate) => candidate.id === task.id),
  );
  const filteredAttentionTasks = attentionTasks
    .filter((task) => {
      if (taskFilter === "urgent") {
        return (
          task.priority === TaskPriority.URGENT ||
          task.priority === TaskPriority.HIGH
        );
      }

      if (taskFilter === "overdue") {
        return (
          new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
        );
      }

      return true;
    })
    .slice(0, 5);
  const projectStatusCounts = projects.reduce<Record<string, number>>(
    (counts, project) => {
      counts[project.status] = (counts[project.status] || 0) + 1;
      return counts;
    },
    {},
  );

  if (projectsLoading || tasksLoading || statsLoading || notificationsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="flex flex-col gap-6" dir="rtl">
      <header className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <LayoutDashboard />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              لوحة تحكم مدير المشاريع
            </h1>
            <p className="text-sm text-muted-foreground">
              مرحباً {user?.name}، إليك نظرة شاملة على مشاريعك ومهام فريقك.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/pm/projects">
              <FolderKanban data-icon="inline-start" />
              عرض المشاريع
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/pm/tasks">
              <ClipboardList data-icon="inline-start" />
              إدارة المهام
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="المشاريع النشطة"
          value={activeProjects}
          detail={`${completedProjects} مكتملة`}
          icon={FolderKanban}
        />
        <MetricCard
          label="المهام قيد التنفيذ"
          value={pmStats?.inProgress ?? 0}
          icon={Clock}
        />
        <MetricCard
          label="بانتظار المراجعة"
          value={pmStats?.inReview ?? 0}
          icon={Inbox}
        />
        <MetricCard
          label="مهام متأخرة"
          value={pmStats?.overdue ?? 0}
          detail={(pmStats?.overdue ?? 0) > 0 ? "تحتاج متابعة" : "لا يوجد"}
          icon={AlertTriangle}
          tone={(pmStats?.overdue ?? 0) > 0 ? "destructive" : "default"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <BarChart3 />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle>حالة المشاريع</CardTitle>
                  <CardDescription>
                    نظرة عامة على المشاريع تحت إدارتك
                  </CardDescription>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/pm/projects">
                  عرض الكل
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {projects.length === 0 ? (
                <DashboardEmpty
                  icon={FolderKanban}
                  title="لا توجد مشاريع"
                  description="لم يتم تعيين أي مشروع لك بعد."
                />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PROJECT_STATUS_LABELS).map(
                      ([status, label]) => {
                        const count = projectStatusCounts[status] || 0;
                        if (count === 0) return null;

                        return (
                          <Badge
                            key={status}
                            variant="secondary"
                            className="gap-2"
                          >
                            {label}
                            <span>{count}</span>
                          </Badge>
                        );
                      },
                    )}
                  </div>
                  <RecentProjectsTable
                    projects={projects.slice(0, 10)}
                    onOpen={(projectId) =>
                      router.push(`/dashboard/pm/projects/${projectId}`)
                    }
                  />
                  {projects.length > 4 && (
                    <Button asChild variant="outline">
                      <Link href="/dashboard/pm/projects">
                        عرض جميع المشاريع ({projects.length})
                        <ArrowUpRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <ClipboardList />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle>مهام تتطلب المتابعة</CardTitle>
                  <CardDescription>
                    {attentionTasks.length > 0
                      ? "مهام ذات أولوية عالية أو متأخرة في مشاريعك"
                      : "لا توجد مهام عاجلة"}
                  </CardDescription>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/pm/tasks">
                  عرض الكل
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {attentionTasks.length > 0 && (
                <Tabs
                  value={taskFilter}
                  onValueChange={(value) => setTaskFilter(value as TaskFilter)}
                >
                  <TabsList>
                    <TabsTrigger value="all">
                      الكل ({attentionTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="urgent">
                      عاجل ({urgentTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="overdue">
                      متأخر ({overdueTasks.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {filteredAttentionTasks.length === 0 ? (
                <DashboardEmpty
                  icon={CheckCircle2}
                  title="لا توجد مهام عاجلة"
                  description="جميع مهام مشاريعك تحت السيطرة."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredAttentionTasks.map((task) => (
                    <Button
                      key={task.id}
                      asChild
                      variant="outline"
                      className="h-auto justify-start whitespace-normal p-4 text-start"
                    >
                      <Link href={`/dashboard/pm/tasks/${task.id}`}>
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <ClipboardList />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate font-medium">
                            {task.title}
                          </span>
                          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">
                              {task.project?.name}
                            </span>
                            {task.assignee?.name && (
                              <span className="inline-flex items-center gap-1">
                                <User />
                                {task.assignee.name}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Calendar />
                              {formatShortDate(task.dueDate)}
                            </span>
                          </span>
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                          <PmStatusBadge domain="task" status={task.status} />
                          {task.priority !== TaskPriority.LOW &&
                            task.priority !== TaskPriority.NORMAL && (
                              <Badge
                                variant={
                                  task.priority === TaskPriority.URGENT
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {TASK_PRIORITY_AR[task.priority]}
                              </Badge>
                            )}
                        </div>
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <TrendingUp />
                </div>
                <CardTitle>إحصائيات المهام</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  إجمالي المهام
                </span>
                <span className="text-2xl font-semibold">
                  {pmStats?.total ?? 0}
                </span>
              </div>
              <Separator />
              <div className="flex flex-col gap-4">
                <TaskStatRow
                  label="للتنفيذ"
                  value={pmStats?.todo ?? 0}
                  max={pmStats?.total ?? 0}
                />
                <TaskStatRow
                  label="قيد التنفيذ"
                  value={pmStats?.inProgress ?? 0}
                  max={pmStats?.total ?? 0}
                />
                <TaskStatRow
                  label="قيد المراجعة"
                  value={pmStats?.inReview ?? 0}
                  max={pmStats?.total ?? 0}
                />
                <TaskStatRow
                  label="منجزة"
                  value={pmStats?.done ?? 0}
                  max={pmStats?.total ?? 0}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Bell />
                </div>
                <CardTitle>آخر النشاطات</CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/notifications">عرض الكل</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <DashboardEmpty
                  icon={Bell}
                  title="لا توجد نشاطات حديثة"
                  description="ستظهر هنا تحديثات المشاريع والمهام الجديدة."
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {notifications.slice(0, 6).map((notification, index) => {
                    const Icon =
                      NOTIFICATION_ICON_MAP[(notification as any).eventType] ??
                      Bell;
                    return (
                      <div
                        key={notification.id || index}
                        className="flex gap-3"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="truncate text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {notification.body}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(
                              notification.createdAt as string,
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  detail?: string;
  icon: React.ElementType;
  tone?: "default" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {detail && (
            <Badge
              variant={tone === "destructive" ? "destructive" : "secondary"}
              className="w-fit"
            >
              {detail}
            </Badge>
          )}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon />
        </div>
      </CardContent>
    </Card>
  );
}

function TaskStatRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const progress = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}

function DashboardEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function RecentProjectsTable({
  projects,
  onOpen,
}: {
  projects: any[];
  onOpen: (projectId: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المشروع</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>التقدم</TableHead>
          <TableHead>المدة</TableHead>
          <TableHead>مدير المشروع</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const progress = Math.round(
            project.progress ?? project.completionPercentage ?? 0,
          );
          return (
            <TableRow
              key={project.id}
              role="link"
              tabIndex={0}
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => onOpen(project.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(project.id);
                }
              }}
            >
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{project.name}</span>
                  {project.client?.companyName && (
                    <span className="text-xs text-muted-foreground">
                      {project.client.companyName}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <PmStatusBadge domain="project" status={project.status} />
              </TableCell>
              <TableCell>
                <div className="flex min-w-36 items-center gap-2">
                  <Progress value={progress} />
                  <span className="text-xs text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatShortDate(project.startDate)} -{" "}
                {formatShortDate(project.endDate)}
              </TableCell>
              <TableCell>{project.manager?.name || "-"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DashboardSkeleton() {
  return (
    <main className="flex flex-col gap-6" dir="rtl">
      <div className="flex flex-col gap-3 border-b pb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-112 xl:col-span-2" />
        <Skeleton className="h-112" />
      </div>
    </main>
  );
}
