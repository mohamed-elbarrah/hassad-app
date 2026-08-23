"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  User,
  TrendingUp,
  Eye,
  AlertTriangle,
  Upload,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  FileText,
  Plus,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { TaskForm } from "@/components/dashboard/pm/TaskForm";
import { TaskKanban } from "@/components/dashboard/pm/TaskKanban";
import { ProjectActivityFeed } from "@/components/dashboard/pm/ProjectActivityFeed";
import {
  buildDefaultClientStats,
  ClientContextPanel,
} from "@/components/client-detail/ClientDetailPattern";
import { PMPeriodsManagement } from "@/components/dashboard/pm/PMPeriodsManagement";
import { PmDetailBreadcrumb } from "@/components/dashboard/pm/shared/PmDetailBreadcrumb";
import { PmDetailError } from "@/components/dashboard/pm/shared/PmDetailError";
import { PmDetailSkeleton } from "@/components/dashboard/pm/shared/PmDetailSkeleton";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import {
  useGetPmProjectByIdQuery,
  useGetPmProjectFilesQuery,
  useUploadPmProjectFileMutation,
  useDeletePmProjectFileMutation,
  useLazyGetPmProjectFileDownloadQuery,
} from "@/features/projects/projectsApi";
import {
  useGetPmTasksQuery,
  type TaskWithProject,
} from "@/features/tasks/tasksApi";
import { useLazyGetProjectGroupChatQuery } from "@/features/chat/chatApi";
import { useGetPmClientTeamViewQuery } from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { ProjectStatus, TaskStatus } from "@hassad/shared";
import { formatShortDate, daysUntil } from "@/lib/format";
import { type ProjectWithMeta } from "@/lib/utils/project-status";
import {
  ProjectStatsGrid,
  ProjectSummaryCard,
  type ProjectDetailEntity,
  type ProjectStatItem,
} from "@/components/project-detail/ProjectDetailPattern";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

// ── Upcoming Deadlines Component ─────────────────────────────────────────────

interface UpcomingDeadlinesProps {
  tasks?: {
    id: string;
    title: string;
    dueDate: string | Date;
    status: string;
  }[];
  projectEndDate?: string;
}

function PageEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="border bg-muted/30 p-10">
      <EmptyMedia variant="icon">
        <Icon />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  );
}

function UpcomingDeadlines({
  tasks = [],
  projectEndDate,
}: UpcomingDeadlinesProps) {
  const deadlines = [];

  // Add project end date
  if (projectEndDate) {
    deadlines.push({
      id: "project-end",
      title: "موعد تسليم المشروع",
      date: projectEndDate,
      type: "milestone" as const,
    });
  }

  // Add upcoming tasks (not done)
  tasks
    .filter((t) => t.status !== TaskStatus.DONE)
    .forEach((t) => {
      deadlines.push({
        id: t.id,
        title: t.title,
        date: t.dueDate,
        type: "task" as const,
        status: t.status,
      });
    });

  // Sort by date
  const sortedDeadlines = deadlines
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (sortedDeadlines.length === 0) {
    return (
      <PageEmptyState
        icon={Clock}
        title="لا توجد مواعيد قريبة"
        description="جميع المهام محدثة ولا توجد مواعيد استحقاق قريبة."
      />
    );
  }

  const daysLeft = (date: string) => {
    const days = daysUntil(date);
    if (days < 0)
      return {
        text: `متأخرة بـ ${Math.abs(days)} يوم`,
        tone: "danger" as const,
      };
    if (days === 0) return { text: "اليوم", tone: "warning" as const };
    if (days <= 3)
      return { text: `بعد ${days} أيام`, tone: "warning" as const };
    return { text: `بعد ${days} يوم`, tone: "neutral" as const };
  };

  return (
    <div className="space-y-3" dir="rtl">
      {sortedDeadlines.map((item) => {
        const { text, tone } = daysLeft(item.date);
        return (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  item.type === "milestone"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {item.type === "milestone" ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatShortDate(item.date)}
                  </span>
                  <Badge
                    variant={
                      tone === "danger"
                        ? "destructive"
                        : tone === "warning"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {text}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useGetPmProjectByIdQuery(id);
  const { data: files, isLoading: filesLoading } =
    useGetPmProjectFilesQuery(id);
  const { data: taskResponse, isLoading: tasksLoading } = useGetPmTasksQuery({
    projectId: id,
    limit: 100,
  });
  const tasks = taskResponse?.items ?? [];

  const clientId = project?.clientId ?? "";
  const { data: teamView } = useGetPmClientTeamViewQuery(clientId, {
    skip: !clientId,
  });

  const [getGroupChat, { isFetching: isLoadingGroupChat }] =
    useLazyGetProjectGroupChatQuery();

  const [uploadFile, { isLoading: isUploading }] =
    useUploadPmProjectFileMutation();
  const [deleteFile] = useDeletePmProjectFileMutation();
  const [getFileDownload] = useLazyGetPmProjectFileDownloadQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openGroupChat = async () => {
    try {
      const conversation = await getGroupChat(id).unwrap();
      if (conversation?.id) {
        router.push(`/dashboard/messages?conversationId=${conversation.id}`);
      }
    } catch {
      // Group chat may not exist yet; ignore silently
    }
  };

  if (!user) return null;

  // Loading state
  if (isLoading) {
    return <PmDetailSkeleton variant="project" />;
  }

  // Error state
  if (isError || !project) {
    return (
      <PmDetailError
        title="المشروع غير موجود"
        onRetry={refetch}
        backHref="/dashboard/pm"
        backLabel="المشاريع"
      />
    );
  }

  const p = project as ProjectWithMeta;
  const progressValue = Math.round(p.progress ?? p.completionPercentage ?? 0);

  // Calculate stats
  const totalTasks = p.taskStats?.total ?? tasks?.length ?? 0;
  const completedTasks = p.taskStats?.completed ?? 0;
  const inProgressTasks = p.taskStats?.inProgress ?? 0;
  const overdueTasks = p.taskStats?.overdue ?? 0;

  // Determine project health
  const getHealthStatus = () => {
    if (overdueTasks > 0)
      return { label: "متأخر", tone: "danger" as const, icon: AlertCircle };
    if (progressValue >= 75)
      return { label: "جيد", tone: "success" as const, icon: CheckCircle2 };
    if (progressValue >= 50)
      return { label: "قيد التقدم", tone: "info" as const, icon: TrendingUp };
    return { label: "في البداية", tone: "neutral" as const, icon: Clock };
  };
  const health = getHealthStatus();
  const projectEntity: ProjectDetailEntity = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    priority: p.priority,
    clientId: project.clientId,
    startDate: String(project.startDate),
    endDate: String(project.endDate),
    completionPercentage: progressValue,
    updatedAt: String(project.updatedAt),
    isArchived: false,
    client: {
      id: p.client?.id ?? project.clientId,
      companyName: p.client?.companyName ?? "—",
    },
    manager: p.manager
      ? {
          id: p.manager.id,
          name: p.manager.name,
          email: undefined,
        }
      : null,
    contract: p.contract ? {} : null,
  };

  const overviewStats: ProjectStatItem[] = [
    {
      label: "المهام المنجزة",
      value: `${completedTasks}/${totalTasks}`,
      hint:
        totalTasks > 0
          ? `${Math.round((completedTasks / totalTasks) * 100)}% اكتمال`
          : "لا توجد مهام بعد",
      icon: FolderKanban,
    },
    {
      label: "المهام المتأخرة",
      value: String(overdueTasks),
      hint: overdueTasks > 0 ? "تحتاج متابعة مباشرة" : "لا يوجد تأخير حاليًا",
      icon: AlertTriangle,
    },
    {
      label: "الوقت المتبقي",
      value: String(daysUntil(project.endDate) ?? "—"),
      hint: formatShortDate(project.endDate),
      icon: Calendar,
    },
    {
      label: "الملفات",
      value: String(files?.length ?? 0),
      hint: "مرفق بالمشروع",
      icon: FileText,
    },
  ];

  return (
    <div className="page-shell" dir="rtl">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <PmDetailBreadcrumb
        backHref="/dashboard/pm"
        backLabel="المشاريع"
        title={project.name}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <PmStatusBadge domain="project" status={project.status} />
          {p.client && (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="size-4" />
              {p.client.companyName}
            </span>
          )}
        </div>
        <ProjectForm project={project} currentUserId={user.id} />
      </div>

      {/* Status Banners */}
      {project.status === ProjectStatus.AWAITING_REVIEW && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Eye className="size-5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">بانتظار المراجعة</p>
              <p className="text-sm text-muted-foreground">
                هذا المشروع بانتظار مراجعة العميل والموافقة.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {project.status === ProjectStatus.NEEDS_REVISION && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">تعديلات مطلوبة</p>
              <p className="text-sm text-muted-foreground">
                طلب العميل تعديلات على هذا المشروع.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            setActiveTab("tasks");
            setTaskFormOpen(true);
          }}
        >
          <Plus data-icon="inline-start" />
          مهمة جديدة
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload data-icon="inline-start" />
          رفع ملف
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={openGroupChat}
          disabled={isLoadingGroupChat}
        >
          محادثة الفريق
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await uploadFile({ projectId: id, file }).unwrap();
            } catch {
              /* best-effort operation; the UI remains usable without this refresh */
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </div>

      <ProjectSummaryCard
        project={projectEntity}
        badges={[
          <Badge key="status" variant="outline">
            {health.label}
          </Badge>,
          <Badge key="progress" variant="secondary">
            التقدم {progressValue}%
          </Badge>,
          p.client ? (
            <Badge key="client" variant="outline">
              {p.client.companyName}
            </Badge>
          ) : null,
        ].filter(Boolean)}
      />

      <ProjectStatsGrid stats={overviewStats} />

      {/* Tabs Navigation */}
      <div dir="rtl">
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:w-auto sm:grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <FolderKanban />
              المهام
              {totalTasks > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedTasks}/{totalTasks}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText />
              الملفات
              {files && files.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {files.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              <User />
              تفاصيل العميل
            </TabsTrigger>
            <TabsTrigger value="periods" className="gap-2">
              <Layers />
              الفترات
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ───────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-5">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Left Column - Activity & Deadlines */}
              <div className="space-y-5 lg:col-span-2">
                {/* Timeline Summary */}
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="size-4 text-muted-foreground" />
                        الجدول الزمني
                      </CardTitle>
                      <CardDescription>
                        من {formatShortDate(project.startDate)} إلى{" "}
                        {formatShortDate(project.endDate)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{progressValue}% إنجاز</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">التقدم</span>
                        <span className="font-medium">{progressValue}%</span>
                      </div>
                      <Progress value={progressValue} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatShortDate(project.startDate)}</span>
                        <span>{formatShortDate(project.endDate)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t pt-6">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-2xl font-semibold">
                          {inProgressTasks}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          قيد التنفيذ
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1 border-s text-center">
                        <p
                          className={cn(
                            "text-2xl font-semibold",
                            overdueTasks > 0 && "text-destructive",
                          )}
                        >
                          {overdueTasks}
                        </p>
                        <p className="text-xs text-muted-foreground">متأخرة</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 border-s text-center">
                        <p className="text-2xl font-semibold">
                          {files?.length ?? 0}
                        </p>
                        <p className="text-xs text-muted-foreground">ملفات</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="size-4 text-muted-foreground" />
                      النشاط الأخير
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectActivityFeed
                      projectStatus={project.status}
                      files={files}
                      tasks={tasks}
                      projectManagerName={p.manager?.name}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Deadlines & Team */}
              <div className="space-y-5">
                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertCircle className="size-4 text-muted-foreground" />
                        المواعيد القادمة
                      </CardTitle>
                      <CardDescription>
                        أقرب العناصر التي تحتاج متابعة.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("tasks")}
                    >
                      عرض الكل
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <UpcomingDeadlines
                      tasks={p.upcomingTasks ?? []}
                      projectEndDate={String(project.endDate)}
                    />
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="size-4 text-muted-foreground" />
                        فريق المشروع
                      </CardTitle>
                      <CardDescription>
                        الأعضاء المشاركون في تنفيذ المشروع.
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      إدارة
                    </Button>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {/* Project Manager */}
                    {p.manager ? (
                      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {p.manager.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {p.manager.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            مدير المشروع
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Task Assignees */}
                    {(() => {
                      // Extract unique assignees from tasks
                      const assigneeMap = new Map<
                        string,
                        {
                          id: string;
                          name: string;
                          taskCount: number;
                          statusCounts: Record<string, number>;
                        }
                      >();

                      (tasks ?? []).forEach((task: TaskWithProject) => {
                        if (task.assignee?.id) {
                          const existing = assigneeMap.get(task.assignee.id);
                          if (existing) {
                            existing.taskCount++;
                            existing.statusCounts[task.status] =
                              (existing.statusCounts[task.status] ?? 0) + 1;
                          } else {
                            assigneeMap.set(task.assignee.id, {
                              id: task.assignee.id,
                              name: task.assignee.name,
                              taskCount: 1,
                              statusCounts: { [task.status]: 1 },
                            });
                          }
                        }
                      });

                      const assignees = Array.from(assigneeMap.values());

                      if (assignees.length === 0) {
                        return (
                          <PageEmptyState
                            icon={User}
                            title="لا يوجد أعضاء فريق"
                            description="لا توجد مهام مسندة لأعضاء الفريق بعد."
                          />
                        );
                      }

                      return (
                        <div className="flex flex-col gap-2">
                          {assignees.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 rounded-xl border p-3"
                            >
                              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                                {member.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {member.name}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {member.taskCount} مهمة
                                  </span>
                                  {member.statusCounts[TaskStatus.DONE] > 0 && (
                                    <span className="text-xs text-primary">
                                      ({member.statusCounts[TaskStatus.DONE]}{" "}
                                      منجزة)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Tasks Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderKanban className="size-4 text-muted-foreground" />
                    المهام
                  </CardTitle>
                  <CardDescription>إدارة وتوزيع مهام المشروع</CardDescription>
                </div>
                <TaskForm
                  projectId={id}
                  open={taskFormOpen}
                  onOpenChange={setTaskFormOpen}
                />
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex h-96 items-center justify-center">
                    <Skeleton className="h-full w-full rounded-xl" />
                  </div>
                ) : totalTasks === 0 ? (
                  <PageEmptyState
                    icon={FolderKanban}
                    title="لا توجد مهام"
                    description="ابدأ بإنشاء أول مهمة لهذا المشروع"
                    action={
                      <Button onClick={() => setTaskFormOpen(true)}>
                        <Plus data-icon="inline-start" />
                        مهمة جديدة
                      </Button>
                    }
                  />
                ) : (
                  <TaskKanban projectId={id} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Files Tab ───────────────────────────────────────────────────── */}
          <TabsContent value="files">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="size-4 text-muted-foreground" />
                    ملفات المشروع
                  </CardTitle>
                  <CardDescription>
                    المستندات والمرفقات المتعلقة بالمشروع
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload data-icon="inline-start" />
                  {isUploading ? "جارٍ الرفع..." : "رفع ملف"}
                </Button>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : !files || files.length === 0 ? (
                  <PageEmptyState
                    icon={FileText}
                    title="لا توجد ملفات"
                    description="ارفع ملفات المشروع لتتمكن من مشاركتها مع الفريق والعميل"
                    action={
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload data-icon="inline-start" />
                        رفع ملف
                      </Button>
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {files.map((file) => (
                      <Card key={file.id}>
                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {((file.fileSize ?? 0) / 1024).toFixed(0)} KB
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const result = await getFileDownload({
                                  projectId: id,
                                  fileId: file.id,
                                }).unwrap();
                                window.open(
                                  result.url,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                            >
                              <Download data-icon="inline-start" />
                              تحميل
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await deleteFile({
                                    projectId: id,
                                    fileId: file.id,
                                  }).unwrap();
                                } catch {
                                  /* best-effort operation; the UI remains usable without this refresh */
                                }
                              }}
                            >
                              <Trash2 data-icon="inline-start" />
                              حذف
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Client Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="client" className="space-y-5">
            {teamView ? (
              <ClientContextPanel
                client={teamView.client}
                profile={teamView.profile}
                mode="internal"
                stats={buildDefaultClientStats(teamView.client, "internal")}
              />
            ) : (
              <Skeleton className="h-96 rounded-xl" />
            )}
          </TabsContent>

          {/* ── Periods Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="periods">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="size-4 text-muted-foreground" />
                  إدارة الفترات الشهرية
                </CardTitle>
                <CardDescription>
                  إدارة الفترات والأهداف لكل شهر من المشروع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PMPeriodsManagement
                  projectId={id}
                  contractType={p.contract?.type}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
