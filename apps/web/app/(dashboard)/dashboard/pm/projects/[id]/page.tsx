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
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { AlertCard } from "@/components/design-system/AlertCard";
import { FileAttachmentRow } from "@/components/design-system/FileAttachmentRow";
import { EmptyState } from "@/components/common/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { ProjectForm } from "@/components/dashboard/pm/ProjectForm";
import { TaskForm } from "@/components/dashboard/pm/TaskForm";
import { TaskKanban } from "@/components/dashboard/pm/TaskKanban";
import { ProjectActivityFeed } from "@/components/dashboard/pm/ProjectActivityFeed";
import { ClientBrief } from "@/components/client-brief";
import { PMPeriodsManagement } from "@/components/dashboard/pm/PMPeriodsManagement";
import {
  useGetProjectByIdQuery,
  useGetProjectFilesQuery,
  useUploadProjectFileMutation,
  useDeleteProjectFileMutation,
} from "@/features/projects/projectsApi";
import { useGetTasksByProjectQuery } from "@/features/tasks/tasksApi";
import { useLazyGetProjectGroupChatQuery } from "@/features/chat/chatApi";
import {
  useGetClientTeamViewQuery,
} from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { ProjectStatus, TaskStatus } from "@hassad/shared";
import { formatDate, formatShortDate, daysUntil } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_KEY,
  type ProjectWithMeta,
} from "@/lib/utils/project-status";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

// ── Quick Stat Card Component ─────────────────────────────────────────────────

interface QuickStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

function QuickStatCard({ icon, label, value, subtext, tone = "neutral" }: QuickStatCardProps) {
  const toneConfig = {
    neutral: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      iconBg: "bg-white",
      iconColor: "text-slate-600",
      valueColor: "text-slate-900",
      labelColor: "text-slate-500",
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-white",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-900",
      labelColor: "text-emerald-700",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-white",
      iconColor: "text-amber-600",
      valueColor: "text-amber-900",
      labelColor: "text-amber-700",
    },
    danger: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      iconBg: "bg-white",
      iconColor: "text-rose-600",
      valueColor: "text-rose-900",
      labelColor: "text-rose-700",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-white",
      iconColor: "text-blue-600",
      valueColor: "text-blue-900",
      labelColor: "text-blue-700",
    },
  };

  const config = toneConfig[tone];

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${config.bg} ${config.border}`}>
      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconBg} shadow-sm`}>
        <div className={config.iconColor}>{icon}</div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium mb-0.5 ${config.labelColor}`}>
          {label}
        </div>
        <div className={`text-xl font-bold tracking-tight ${config.valueColor}`}>
          {value}
        </div>
        {subtext && (
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upcoming Deadlines Component ─────────────────────────────────────────────

interface UpcomingDeadlinesProps {
  tasks?: { id: string; title: string; dueDate: string; status: string }[];
  projectEndDate?: string;
}

function UpcomingDeadlines({ tasks = [], projectEndDate }: UpcomingDeadlinesProps) {
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
      <EmptyState
        icon={Clock}
        title="لا توجد مواعيد قريبة"
        description="جميع المهام محدثة ولا توجد مواعيد استحقاق قريبة."
      />
    );
  }

  const daysLeft = (date: string) => {
    const days = daysUntil(date);
    if (days < 0) return { text: `متأخرة بـ ${Math.abs(days)} يوم`, tone: "danger" as const };
    if (days === 0) return { text: "اليوم", tone: "warning" as const };
    if (days <= 3) return { text: `بعد ${days} أيام`, tone: "warning" as const };
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
                item.type === "milestone" ? "bg-secondary-100 text-secondary-600" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {item.type === "milestone" ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-natural-100 truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-neutral-400">{formatShortDate(item.date)}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tone === "danger"
                      ? "bg-danger-100 text-danger-600"
                      : tone === "warning"
                      ? "bg-warning-100 text-warning-600"
                      : "bg-neutral-100 text-neutral-500"
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

  const { data: project, isLoading: projectLoading, isError: projectError } = useGetProjectByIdQuery(id);
  const { data: files, isLoading: filesLoading } = useGetProjectFilesQuery(id);
  const { data: tasks, isLoading: tasksLoading } = useGetTasksByProjectQuery(id);

  const clientId = project?.clientId ?? "";
  const { data: teamView } = useGetClientTeamViewQuery(clientId, {
    skip: !clientId,
  });

  const [getGroupChat, { isFetching: isLoadingGroupChat }] =
    useLazyGetProjectGroupChatQuery();

  const [uploadFile, { isLoading: isUploading }] = useUploadProjectFileMutation();
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
  if (projectLoading) {
    return (
      <div className="flex flex-col gap-6">
        <DSSkeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <DSSkeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <DSSkeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (projectError || !project) {
    return (
      <EmptyState
        title="المشروع غير موجود"
        description="لا يمكن الوصول إلى هذا المشروع. ربما تم حذفه أو ليس لديك صلاحية."
        actionLabel="العودة للمشاريع"
        actionHref="/dashboard/pm/projects"
      />
    );
  }

  const p = project as ProjectWithMeta;
  const progressValue = Math.round(p.progress ?? p.completionPercentage ?? 0);

  // Calculate stats
  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === TaskStatus.DONE).length ?? 0;
  const inProgressTasks = tasks?.filter((t) => t.status === TaskStatus.IN_PROGRESS).length ?? 0;
  const overdueTasks =
    tasks?.filter((t) => {
      if (t.status === TaskStatus.DONE) return false;
      return new Date(t.dueDate) < new Date();
    }).length ?? 0;

  // Determine project health
  const getHealthStatus = () => {
    if (overdueTasks > 0) return { label: "متأخر", tone: "danger" as const, icon: AlertCircle };
    if (progressValue >= 75) return { label: "جيد", tone: "success" as const, icon: CheckCircle2 };
    if (progressValue >= 50) return { label: "قيد التقدم", tone: "info" as const, icon: TrendingUp };
    return { label: "في البداية", tone: "neutral" as const, icon: Clock };
  };
  const health = getHealthStatus();
  const HealthIcon = health.icon;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="bg-white py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/pm/projects"
              className="p-2 -ms-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-natural-100">{project.name}</h1>
              <StatusBadge
                status={PROJECT_STATUS_BADGE_KEY[project.status as ProjectStatus]}
                label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
              />
              {p.client && (
                <Link
                  href={`/dashboard/sales/clients/${p.client.id}`}
                  className="text-sm text-secondary-600 hover:text-secondary-700 hover:underline transition-colors flex items-center gap-1"
                >
                  <Building2 className="w-4 h-4" />
                  {p.client.companyName}
                </Link>
              )}
            </div>
          </div>
          <ProjectForm project={project} currentUserId={user.id} />
        </div>
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
              <span className="ms-1 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">
                {completedTasks}/{totalTasks}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileText className="w-4 h-4" />
            الملفات
            {files && files.length > 0 && (
              <span className="ms-1 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">
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
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStatCard
              icon={<HealthIcon className="w-5 h-5" />}
              label="حالة المشروع"
              value={health.label}
              tone={health.tone}
            />
            <QuickStatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="المهام المنجزة"
              value={`${completedTasks}/${totalTasks}`}
              subtext={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% اكتمال` : undefined}
              tone="success"
            />
            <QuickStatCard
              icon={<Clock className="w-5 h-5" />}
              label="الوقت المتبقي"
              value={daysUntil(project.endDate) ?? "—"}
              subtext={formatShortDate(project.endDate)}
              tone="warning"
            />
            <QuickStatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="التقدم العام"
              value={`${progressValue}%`}
              tone="info"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Activity & Deadlines */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline Summary */}
              <SurfaceCard
                title="الجدول الزمني"
                icon={Calendar}
                action={
                  <span className="text-sm text-neutral-500 font-medium">
                    من {formatShortDate(project.startDate)} إلى {formatShortDate(project.endDate)}
                  </span>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">التقدم</span>
                    <span className="font-medium">{progressValue}%</span>
                  </div>
                  <ProgressBar value={progressValue} variant="default" size="md" />
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{formatShortDate(project.startDate)}</span>
                    <span>{formatShortDate(project.endDate)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-portal-divider">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-natural-100">{inProgressTasks}</p>
                    <p className="text-xs text-neutral-400 mt-1">قيد التنفيذ</p>
                  </div>
                  <div className="text-center border-e border-portal-divider">
                    <p className={`text-2xl font-bold ${overdueTasks > 0 ? "text-danger-500" : "text-natural-100"}`}>
                      {overdueTasks}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">متأخرة</p>
                  </div>
                  <div className="text-center border-e border-portal-divider">
                    <p className="text-2xl font-bold text-natural-100">{files?.length ?? 0}</p>
                    <p className="text-xs text-neutral-400 mt-1">ملفات</p>
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
            <div className="space-y-6">
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
                <UpcomingDeadlines tasks={tasks as any} projectEndDate={String(project.endDate)} />
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
                        <p className="text-sm font-medium text-natural-100">{p.manager.name}</p>
                        <p className="text-xs text-secondary-600">مدير المشروع</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Task Assignees */}
                  {(() => {
                    // Extract unique assignees from tasks
                    const assigneeMap = new Map<string, { id: string; name: string; taskCount: number; statusCounts: Record<string, number> }>();
                    
                    (tasks ?? []).forEach((task: any) => {
                      if (task.assignee?.id) {
                        const existing = assigneeMap.get(task.assignee.id);
                        if (existing) {
                          existing.taskCount++;
                          existing.statusCounts[task.status] = (existing.statusCounts[task.status] ?? 0) + 1;
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
                        <div className="text-center py-6 border border-dashed border-neutral-200 rounded-xl">
                          <p className="text-sm text-neutral-400">لا يوجد أعضاء فريق مسندة لهم مهام</p>
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
                            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center font-semibold text-sm">
                              {member.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-natural-100 truncate">{member.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-neutral-400">{member.taskCount} مهمة</span>
                                {member.statusCounts[TaskStatus.DONE] > 0 && (
                                  <span className="text-xs text-emerald-600">
                                    ({member.statusCounts[TaskStatus.DONE]} منجزة)
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
            action={<TaskForm projectId={id} open={taskFormOpen} onOpenChange={setTaskFormOpen} />}
          >
            {tasksLoading ? (
              <div className="h-96 flex items-center justify-center">
                <DSSkeleton className="h-full w-full" />
              </div>
            ) : totalTasks === 0 ? (
              <EmptyState
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
              <EmptyState
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
                          className="text-danger-500 hover:text-danger-600"
                          onClick={async () => {
                            try {
                              await deleteFile({ projectId: id, fileId: file.id }).unwrap();
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
        <TabsContent value="client" className="space-y-6">
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
            <PMPeriodsManagement projectId={id} contractType={p.contract?.type} />
          </SurfaceCard>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
