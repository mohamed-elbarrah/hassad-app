"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
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
import { buildPortalFileUrl } from "@/lib/portal-files";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { AlertCard } from "@/components/design-system/AlertCard";
import { FileAttachmentRow } from "@/components/design-system/FileAttachmentRow";
import { InfoPanel } from "@/components/design-system/InfoPanel";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { TaskForm } from "@/components/dashboard/pm/TaskForm";
import { TaskKanban } from "@/components/dashboard/pm/TaskKanban";
import { ProjectActivityFeed } from "@/components/dashboard/pm/ProjectActivityFeed";
import { ClientBrief } from "@/components/client-brief";
import { PMPeriodsManagement } from "@/components/dashboard/pm/PMPeriodsManagement";
import { PmDetailBreadcrumb } from "@/components/dashboard/pm/shared/PmDetailBreadcrumb";
import { PmDetailError } from "@/components/dashboard/pm/shared/PmDetailError";
import { PmDetailSkeleton } from "@/components/dashboard/pm/shared/PmDetailSkeleton";
import { PmEmptyState } from "@/components/dashboard/pm/shared/PmEmptyState";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import {
  useGetProjectByIdQuery,
  useGetProjectFilesQuery,
  useUploadProjectFileMutation,
  useDeleteProjectFileMutation,
} from "@/features/projects/projectsApi";
import { useGetTasksByProjectQuery } from "@/features/tasks/tasksApi";
import { useLazyGetProjectGroupChatQuery } from "@/features/chat/chatApi";
import { useGetClientTeamViewQuery } from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { ProjectStatus, TaskStatus } from "@hassad/shared";
import { formatDate, formatShortDate, daysUntil } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  type ProjectWithMeta,
} from "@/lib/utils/project-status";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

// ── Upcoming Deadlines Component ─────────────────────────────────────────────

interface UpcomingDeadlinesProps {
  tasks?: { id: string; title: string; dueDate: string; status: string }[];
  projectEndDate?: string;
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
      <PmEmptyState
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
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-portal-card-border bg-white hover:shadow-sm transition-all"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                item.type === "milestone"
                  ? "bg-secondary-100 text-secondary-600"
                  : "bg-badge-gray-bg text-portal-note-text"
              }`}
            >
              {item.type === "milestone" ? (
                <Clock className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-natural-100 truncate">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-portal-note-text">
                  {formatShortDate(item.date)}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tone === "danger"
                      ? "bg-danger-100 text-danger-600"
                      : tone === "warning"
                        ? "bg-alert-100 text-alert-600"
                        : "bg-badge-gray-bg text-portal-note-text"
                  }`}
                >
                  {text}
                </span>
              </div>
            </div>
          </div>
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
  } = useGetProjectByIdQuery(id);
  const { data: files, isLoading: filesLoading } = useGetProjectFilesQuery(id);
  const { data: tasks, isLoading: tasksLoading } =
    useGetTasksByProjectQuery(id);

  const clientId = project?.clientId ?? "";
  const { data: teamView } = useGetClientTeamViewQuery(clientId, {
    skip: !clientId,
  });

  const [getGroupChat, { isFetching: isLoadingGroupChat }] =
    useLazyGetProjectGroupChatQuery();

  const [uploadFile, { isLoading: isUploading }] =
    useUploadProjectFileMutation();
  const [deleteFile] = useDeleteProjectFileMutation();
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
        backHref="/dashboard/pm/projects"
        backLabel="المشاريع"
      />
    );
  }

  const p = project as ProjectWithMeta;
  const progressValue = Math.round(p.progress ?? p.completionPercentage ?? 0);

  // Calculate stats
  const totalTasks = tasks?.length ?? 0;
  const completedTasks =
    tasks?.filter((t) => t.status === TaskStatus.DONE).length ?? 0;
  const inProgressTasks =
    tasks?.filter((t) => t.status === TaskStatus.IN_PROGRESS).length ?? 0;
  const overdueTasks =
    tasks?.filter((t) => {
      if (t.status === TaskStatus.DONE) return false;
      return new Date(t.dueDate) < new Date();
    }).length ?? 0;

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
  const HealthIcon = health.icon;

  return (
    <div className="flex flex-col gap-5  " dir="rtl">
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <PmDetailBreadcrumb
        backHref="/dashboard/pm/projects"
        backLabel="المشاريع"
        title={project.name}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-natural-100">{project.name}</h1>
          <PmStatusBadge domain="project" status={project.status} />
          {p.client && (
            <Link
              href={`/dashboard/sales/clients/${p.client.id}`}
              className="text-sm text-secondary-500 hover:underline transition-colors flex items-center gap-1"
            >
              <Building2 className="w-4 h-4" />
              {p.client.companyName}
            </Link>
          )}
        </div>
        <ProjectForm project={project} currentUserId={user.id} />
      </div>

      {/* Status Banners */}
      {project.status === ProjectStatus.AWAITING_REVIEW && (
        <AlertCard variant="warning" className="flex items-center gap-3">
          <Eye className="size-5 shrink-0" />
          <span>هذا المشروع بانتظار مراجعة العميل والموافقة.</span>
        </AlertCard>
      )}
      {project.status === ProjectStatus.NEEDS_REVISION && (
        <AlertCard variant="danger" className="flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0" />
          <span>طلب العميل تعديلات على هذا المشروع.</span>
        </AlertCard>
      )}

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton
          size="sm"
          onClick={() => {
            setActiveTab("tasks");
            setTaskFormOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          مهمة جديدة
        </ActionButton>
        <ActionButton
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          icon={<Upload className="w-4 h-4" />}
        >
          رفع ملف
        </ActionButton>
        <ActionButton
          variant="outline"
          size="sm"
          onClick={openGroupChat}
          loading={isLoadingGroupChat}
        >
          محادثة الفريق
        </ActionButton>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await uploadFile({ projectId: id, file }).unwrap();
            } catch {}
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </div>

      {/* Tabs Navigation */}
      <div dir="rtl">
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <FolderKanban className="w-4 h-4" />
              المهام
              {totalTasks > 0 && (
                <span className="ms-1 text-xs bg-badge-gray-bg px-1.5 py-0.5 rounded-full text-portal-note-text">
                  {completedTasks}/{totalTasks}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="w-4 h-4" />
              الملفات
              {files && files.length > 0 && (
                <span className="ms-1 text-xs bg-badge-gray-bg px-1.5 py-0.5 rounded-full text-portal-note-text">
                  {files.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              <User className="w-4 h-4" />
              تفاصيل العميل
            </TabsTrigger>
            <TabsTrigger value="periods" className="gap-2">
              <Layers className="w-4 h-4" />
              الفترات
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ───────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-5">
            {/* Quick Stats Grid using InfoPanel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoPanel variant="default" title="حالة المشروع">
                <div className="flex items-center gap-2">
                  <HealthIcon
                    className={`w-5 h-5 ${
                      health.tone === "danger"
                        ? "text-danger-600"
                        : health.tone === "success"
                          ? "text-success-600"
                          : health.tone === "info"
                            ? "text-action-blue"
                            : "text-portal-note-text"
                    }`}
                  />
                  <span className="text-sm font-semibold text-natural-100">
                    {health.label}
                  </span>
                </div>
              </InfoPanel>
              <InfoPanel variant="default" title="المهام المنجزة">
                <p className="text-sm font-semibold text-natural-100">
                  {completedTasks}/{totalTasks}
                </p>
                {totalTasks > 0 && (
                  <p className="text-xs text-portal-note-text">
                    {Math.round((completedTasks / totalTasks) * 100)}% اكتمال
                  </p>
                )}
              </InfoPanel>
              <InfoPanel variant="default" title="الوقت المتبقي">
                <p className="text-sm font-semibold text-natural-100">
                  {daysUntil(project.endDate) ?? "—"}
                </p>
                <p className="text-xs text-portal-note-text">
                  {formatShortDate(project.endDate)}
                </p>
              </InfoPanel>
              <InfoPanel variant="default" title="التقدم العام">
                <p className="text-sm font-semibold text-natural-100">
                  {progressValue}%
                </p>
              </InfoPanel>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column - Activity & Deadlines */}
              <div className="lg:col-span-2 space-y-5">
                {/* Timeline Summary */}
                <SurfaceCard
                  title="الجدول الزمني"
                  icon={Calendar}
                  action={
                    <span className="text-sm text-portal-note-text font-medium">
                      من {formatShortDate(project.startDate)} إلى{" "}
                      {formatShortDate(project.endDate)}
                    </span>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-portal-note-text">التقدم</span>
                      <span className="font-medium text-natural-100">
                        {progressValue}%
                      </span>
                    </div>
                    <ProgressBar
                      value={progressValue}
                      variant="default"
                      size="md"
                    />
                    <div className="flex items-center justify-between text-xs text-portal-note-text">
                      <span>{formatShortDate(project.startDate)}</span>
                      <span>{formatShortDate(project.endDate)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-portal-divider">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-natural-100">
                        {inProgressTasks}
                      </p>
                      <p className="text-xs text-portal-note-text mt-1">
                        قيد التنفيذ
                      </p>
                    </div>
                    <div className="text-center border-e border-portal-divider">
                      <p
                        className={`text-2xl font-bold ${overdueTasks > 0 ? "text-danger-600" : "text-natural-100"}`}
                      >
                        {overdueTasks}
                      </p>
                      <p className="text-xs text-portal-note-text mt-1">
                        متأخرة
                      </p>
                    </div>
                    <div className="text-center border-e border-portal-divider">
                      <p className="text-2xl font-bold text-natural-100">
                        {files?.length ?? 0}
                      </p>
                      <p className="text-xs text-portal-note-text mt-1">
                        ملفات
                      </p>
                    </div>
                  </div>
                </SurfaceCard>

                {/* Recent Activity */}
                <SurfaceCard title="النشاط الأخير" icon={Clock}>
                  <ProjectActivityFeed
                    projectStatus={project.status}
                    files={files}
                    tasks={tasks}
                    projectManagerName={p.manager?.name}
                  />
                </SurfaceCard>
              </div>

              {/* Right Column - Deadlines & Team */}
              <div className="space-y-5">
                {/* Upcoming Deadlines */}
                <SurfaceCard
                  title="المواعيد القادمة"
                  icon={AlertCircle}
                  action={
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("tasks")}
                    >
                      عرض الكل
                    </ActionButton>
                  }
                >
                  <UpcomingDeadlines
                    tasks={tasks as any}
                    projectEndDate={String(project.endDate)}
                  />
                </SurfaceCard>

                {/* Team Members */}
                <SurfaceCard
                  title="فريق المشروع"
                  icon={User}
                  action={
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      disabled
                    >
                      إدارة
                    </ActionButton>
                  }
                >
                  <div className="space-y-3">
                    {/* Project Manager */}
                    {p.manager ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 border border-secondary-100">
                        <div className="w-10 h-10 rounded-full bg-secondary-500 text-white flex items-center justify-center font-semibold text-sm">
                          {p.manager.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-natural-100">
                            {p.manager.name}
                          </p>
                          <p className="text-xs text-secondary-600">
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

                      (tasks ?? []).forEach((task: any) => {
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
                          <div className="text-center py-6 border border-dashed border-portal-card-border rounded-xl">
                            <p className="text-sm text-portal-note-text">
                              لا يوجد أعضاء فريق مسندة لهم مهام
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {assignees.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-portal-card-border hover:shadow-sm transition-all"
                            >
                              <div className="w-10 h-10 rounded-full bg-badge-gray-bg text-portal-note-text flex items-center justify-center font-semibold text-sm">
                                {member.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-natural-100 truncate">
                                  {member.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-portal-note-text">
                                    {member.taskCount} مهمة
                                  </span>
                                  {member.statusCounts[TaskStatus.DONE] > 0 && (
                                    <span className="text-xs text-success-600">
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
                  </div>
                </SurfaceCard>
              </div>
            </div>
          </TabsContent>

          {/* ── Tasks Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="tasks">
            <SurfaceCard
              title="المهام"
              description="إدارة وتوزيع مهام المشروع"
              icon={FolderKanban}
              action={
                <TaskForm
                  projectId={id}
                  open={taskFormOpen}
                  onOpenChange={setTaskFormOpen}
                />
              }
            >
              {tasksLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <DSSkeleton className="h-full w-full" />
                </div>
              ) : totalTasks === 0 ? (
                <PmEmptyState
                  icon={FolderKanban}
                  title="لا توجد مهام"
                  description="ابدأ بإنشاء أول مهمة لهذا المشروع"
                  actionLabel="مهمة جديدة"
                  onAction={() => setTaskFormOpen(true)}
                />
              ) : (
                <TaskKanban projectId={id} />
              )}
            </SurfaceCard>
          </TabsContent>

          {/* ── Files Tab ───────────────────────────────────────────────────── */}
          <TabsContent value="files">
            <SurfaceCard
              title="ملفات المشروع"
              description="المستندات والمرفقات المتعلقة بالمشروع"
              icon={FileText}
              action={
                <ActionButton
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="size-4" />}
                  disabled={isUploading}
                >
                  {isUploading ? "جارٍ الرفع..." : "رفع ملف"}
                </ActionButton>
              }
            >
              {filesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <DSSkeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : !files || files.length === 0 ? (
                <PmEmptyState
                  icon={FileText}
                  title="لا توجد ملفات"
                  description="ارفع ملفات المشروع لتتمكن من مشاركتها مع الفريق والعميل"
                  actionLabel="رفع ملف"
                  onAction={() => fileInputRef.current?.click()}
                />
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <FileAttachmentRow
                      key={file.id}
                      filename={file.fileName}
                      size={`${(file.fileSize / 1024).toFixed(0)} KB`}
                      action={
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url || buildPortalFileUrl(file.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              icon={<Download className="size-4" />}
                            >
                              تحميل
                            </ActionButton>
                          </a>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            className="text-danger-600 hover:text-danger-700"
                            onClick={async () => {
                              try {
                                await deleteFile({
                                  projectId: id,
                                  fileId: file.id,
                                }).unwrap();
                              } catch {}
                            }}
                            icon={<Trash2 className="size-4" />}
                          >
                            حذف
                          </ActionButton>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </SurfaceCard>
          </TabsContent>

          {/* ── Client Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="client" className="space-y-5">
            {teamView ? (
              <ClientBrief
                client={teamView.client}
                profile={teamView.profile}
                viewAs="internal"
              />
            ) : (
              <DSSkeleton className="h-96 rounded-xl" />
            )}
          </TabsContent>

          {/* ── Periods Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="periods">
            <SurfaceCard
              title="إدارة الفترات الشهرية"
              description="إدارة الفترات والأهداف لكل شهر من المشروع"
              icon={Layers}
            >
              <PMPeriodsManagement
                projectId={id}
                contractType={p.contract?.type}
              />
            </SurfaceCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
