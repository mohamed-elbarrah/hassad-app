"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  Send,
  Paperclip,
  Upload,
  Download,
  Trash2,
  File,
  FileImage,
  FileText,
  MessageSquare,
  User,
  Clock,
  Calendar,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { ProgressBar } from "@/components/design-system/ProgressBar";
import { EmptyState } from "@/components/common/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/design-system/Tabs";
import { TaskWorkflowStepper } from "@/components/dashboard/pm/TaskWorkflowStepper";
import { ClientBriefCompact } from "@/components/client-brief";
import { downloadTaskFile } from "@/lib/downloadFile";
import { toast } from "sonner";
import {
  useGetTaskByIdQuery,
  useStartTaskMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useRejectTaskMutation,
  useGetTaskFilesQuery,
  useUploadTaskFileMutation,
  useDeleteTaskFileMutation,
  useGetTaskCommentsQuery,
  useAddTaskCommentMutation,
} from "@/features/tasks/tasksApi";
import {
  useGetClientTeamViewQuery,
} from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { formatRelativeTime, formatShortDate } from "@/lib/format";
import {
  TaskStatus,
  TaskPriority,
  TaskDepartment,
  UserRole,
  FilePurpose,
  type TaskComment,
} from "@hassad/shared";
import type { TaskFile } from "@hassad/shared";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLOR,
  TASK_PRIORITY_LABELS,
} from "@/lib/utils/task-status";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

// ── Status Transition Config ────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; tone: string; next: TaskStatus }
> = {
  [TaskStatus.TODO]: {
    label: "بدء العمل",
    icon: <ArrowRight className="w-4 h-4" />,
    tone: "blue",
    next: TaskStatus.IN_PROGRESS,
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "إرسال للمراجعة",
    icon: <Send className="w-4 h-4" />,
    tone: "purple",
    next: TaskStatus.IN_REVIEW,
  },
  [TaskStatus.IN_REVIEW]: {
    label: "",
    icon: null,
    tone: "",
    next: TaskStatus.DONE,
  },
  [TaskStatus.REVISION]: {
    label: "بدء العمل مجدداً",
    icon: <RotateCcw className="w-4 h-4" />,
    tone: "amber",
    next: TaskStatus.IN_PROGRESS,
  },
  [TaskStatus.DONE]: {
    label: "",
    icon: null,
    tone: "",
    next: TaskStatus.DONE,
  },
};

const PM_ACTIONS: Record<TaskStatus, { label: string; icon: React.ReactNode; action: "approve" | "reject" }[]> = {
  [TaskStatus.TODO]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.IN_REVIEW]: [
    { label: "اعتماد وإنجاز", icon: <Check className="w-4 h-4" />, action: "approve" },
    { label: "طلب تعديل", icon: <X className="w-4 h-4" />, action: "reject" },
  ],
  [TaskStatus.REVISION]: [],
  [TaskStatus.DONE]: [],
};

const DEPARTMENT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "التصميم",
  [TaskDepartment.MARKETING]: "التسويق",
  [TaskDepartment.DEVELOPMENT]: "التطوير",
  [TaskDepartment.CONTENT]: "المحتوى",
  [TaskDepartment.PRODUCTION]: "المونتاج",
};

const FILE_PURPOSE_LABELS: Record<FilePurpose, string> = {
  [FilePurpose.DELIVERABLE]: "تسليم نهائي",
  [FilePurpose.REFERENCE]: "مرجع",
  [FilePurpose.INTERNAL_DRAFT]: "مسودة داخلية",
};

const FILE_PURPOSE_COLORS: Record<FilePurpose, string> = {
  [FilePurpose.DELIVERABLE]: "bg-emerald-50 text-emerald-700 border-emerald-200",
  [FilePurpose.REFERENCE]: "bg-blue-50 text-blue-700 border-blue-200",
  [FilePurpose.INTERNAL_DRAFT]: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className="size-5 text-blue-500" />;
  if (mimeType.startsWith("text/") || mimeType.includes("pdf"))
    return <FileText className="size-5 text-amber-500" />;
  return <File className="size-5 text-neutral-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function CommentCard({ comment }: { comment: TaskComment }) {
  const authorName = comment.user?.name ?? "مستخدم";
  const initials = authorName.charAt(0);

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-white border border-portal-card-border">
      <div className="w-9 h-9 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center font-semibold text-sm shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-natural-100">{authorName}</span>
          <span className="text-[11px] text-neutral-400">
            {formatRelativeTime(comment.createdAt as string)}
          </span>
        </div>
        <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = use(params);
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: task, isLoading, isError } = useGetTaskByIdQuery(id);
  const { data: files, isLoading: filesLoading } = useGetTaskFilesQuery(id);
  const { data: comments, isLoading: commentsLoading } = useGetTaskCommentsQuery(id);

  const clientId =
    (task as any)?.project?.client?.id ?? (task as any)?.project?.clientId ?? "";
  const { data: teamView } = useGetClientTeamViewQuery(clientId, {
    skip: !clientId,
  });

  // Mutations
  const [startTask, { isLoading: isStarting }] = useStartTaskMutation();
  const [submitTask, { isLoading: isSubmitting }] = useSubmitTaskMutation();
  const [approveTask, { isLoading: isApproving }] = useApproveTaskMutation();
  const [rejectTask, { isLoading: isRejecting }] = useRejectTaskMutation();
  const isUpdatingStatus = isStarting || isSubmitting || isApproving || isRejecting;

  const [uploadFile, { isLoading: isUploading }] = useUploadTaskFileMutation();
  const [deleteFile] = useDeleteTaskFileMutation();
  const [addComment, { isLoading: isAddingComment }] = useAddTaskCommentMutation();

  // Local state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [filePurpose, setFilePurpose] = useState<FilePurpose>(FilePurpose.REFERENCE);

  if (!user) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <DSSkeleton className="h-8 w-48" />
        <DSSkeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DSSkeleton className="h-64 rounded-2xl" />
            <DSSkeleton className="h-48 rounded-2xl" />
          </div>
          <DSSkeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error / not found
  if (isError || !task) {
    return (
      <EmptyState
        title="المهمة غير موجودة"
        description="لا يمكن الوصول إلى هذه المهمة. ربما تم حذفها أو ليس لديك صلاحية."
        actionLabel="العودة للمهام"
        actionHref="/dashboard/pm/projects"
      />
    );
  }

  const t = task as typeof task & {
    project?: { id: string; name: string };
    assignee?: { id: string; name: string };
    statusHistory?: Array<{
      id: string;
      fromStatus: TaskStatus;
      toStatus: TaskStatus;
      changedAt: string | Date;
    }>;
  };

  const backHref = t.project
    ? `/dashboard/pm/projects/${t.project.id}`
    : "/dashboard/pm/projects";

  // Status actions
  const isPm = user.role === UserRole.PM || user.role === UserRole.ADMIN;
  const pmActions = PM_ACTIONS[task.status];

  async function handleStatusUpdate(action: "start" | "submit" | "approve" | "reject") {
    try {
      if (action === "start") await startTask(id).unwrap();
      else if (action === "submit") await submitTask(id).unwrap();
      else if (action === "approve") await approveTask(id).unwrap();
      else if (action === "reject") await rejectTask(id).unwrap();
      toast.success("تم تحديث حالة المهمة");
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile({ taskId: id, file, purpose: filePurpose }).unwrap();
      toast.success("تم رفع الملف بنجاح");
    } catch {
      toast.error("فشل رفع الملف");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddComment() {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    try {
      await addComment({ taskId: id, content: trimmed }).unwrap();
      setCommentText("");
      toast.success("تم إضافة التعليق");
    } catch {
      toast.error("فشل إضافة التعليق");
    }
  }

  const totalComments = comments?.length ?? 0;
  const totalFiles = files?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Sticky Breadcrumb Header ───────────────────────────────────── */}
      <div className="bg-white py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="p-2 -ms-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Link href="/dashboard/pm/projects" className="hover:text-secondary-500 transition-colors">
                  المشاريع
                </Link>
                <span>/</span>
                {t.project && (
                  <>
                    <Link href={`/dashboard/pm/projects/${t.project.id}`} className="hover:text-secondary-500 transition-colors">
                      {t.project.name}
                    </Link>
                    <span>/</span>
                  </>
                )}
                <span className="text-natural-100">{task.title}</span>
              </nav>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <h1 className="text-xl font-bold text-natural-100">{task.title}</h1>
                <StatusBadge
                  status={
                    task.status === TaskStatus.DONE
                      ? "COMPLETED"
                      : task.status === TaskStatus.IN_REVIEW
                      ? "PENDING"
                      : task.status === TaskStatus.REVISION
                      ? "REJECTED"
                      : task.status === TaskStatus.IN_PROGRESS
                      ? "ACTIVE"
                      : "PENDING"
                  }
                  label={TASK_STATUS_LABELS[task.status as TaskStatus]}
                />
                {typeof task.revisionCount === "number" && task.revisionCount > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    تعديل {task.revisionCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Workflow Stepper ───────────────────────────────────────────── */}
      <SurfaceCard contentClassName="p-5">
        <TaskWorkflowStepper
          currentStatus={task.status as TaskStatus}
          revisionCount={task.revisionCount ?? 0}
        />
      </SurfaceCard>

      {/* ── PM Actions (Prominent) ────────────────────────────────────── */}
      {isPm && pmActions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {pmActions.map((action) => (
            <ActionButton
              key={action.action}
              size="lg"
              onClick={() => handleStatusUpdate(action.action)}
              disabled={isUpdatingStatus}
              icon={action.icon}
              className={cn(
                "rounded-xl px-6",
                action.action === "approve"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                  : "bg-white border-rose-200 text-rose-700 hover:bg-rose-50"
              )}
            >
              {action.label}
            </ActionButton>
          ))}
        </div>
      )}

      {/* ── Employee Action ───────────────────────────────────────────── */}
      {!isPm && STATUS_TRANSITIONS[task.status as TaskStatus]?.label && (
        <div className="flex">
          <ActionButton
            size="lg"
            onClick={() => {
              const transition = STATUS_TRANSITIONS[task.status as TaskStatus];
              if (transition.next === TaskStatus.IN_PROGRESS) handleStatusUpdate("start");
              else if (transition.next === TaskStatus.IN_REVIEW) handleStatusUpdate("submit");
            }}
            disabled={isUpdatingStatus}
            icon={STATUS_TRANSITIONS[task.status as TaskStatus].icon}
            className="rounded-xl px-6"
          >
            {STATUS_TRANSITIONS[task.status as TaskStatus].label}
          </ActionButton>
        </div>
      )}

      {/* ── Main Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2/3) ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="gap-2">
                <FolderKanban className="w-4 h-4" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                التعليقات
                {totalComments > 0 && (
                  <span className="mr-1 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">{totalComments}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <Paperclip className="w-4 h-4" />
                الملفات
                {totalFiles > 0 && (
                  <span className="mr-1 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">{totalFiles}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="client" className="gap-2">
                <User className="w-4 h-4" />
                تفاصيل العميل
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Description */}
              <SurfaceCard title="الوصف" icon={FileText}>
                {task.description ? (
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                    {task.description}
                  </p>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="لا يوجد وصف"
                    description="لم يتم إضافة وصف لهذه المهمة"
                  />
                )}
              </SurfaceCard>

              {/* Files Preview */}
              <SurfaceCard
                title="الملفات"
                icon={Paperclip}
                action={
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("files")}
                  >
                    عرض الكل
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
                    icon={Paperclip}
                    title="لا توجد ملفات"
                    description="لا توجد ملفات مرفقة بهذه المهمة"
                  />
                ) : (
                  <div className="space-y-2">
                    {files.slice(0, 5).map((file: TaskFile) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-portal-card-border hover:shadow-sm transition-all"
                      >
                        <FileIcon mimeType={file.mimeType} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-neutral-400">{formatFileSize(file.fileSize)}</span>
                            {file.purpose && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${FILE_PURPOSE_COLORS[file.purpose as FilePurpose]}`}>
                                {FILE_PURPOSE_LABELS[file.purpose as FilePurpose]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SurfaceCard>

              {/* Comments Preview */}
              <SurfaceCard
                title="آخر التعليقات"
                icon={MessageSquare}
                action={
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("comments")}
                  >
                    عرض الكل
                  </ActionButton>
                }
              >
                {commentsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <DSSkeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : !comments || comments.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="لا توجد تعليقات"
                    description="ابدأ النقاش بإضافة أول تعليق"
                  />
                ) : (
                  <div className="space-y-3">
                    {[...comments]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 3)
                      .map((comment: TaskComment) => (
                        <CommentCard key={comment.id} comment={comment} />
                      ))}
                  </div>
                )}
              </SurfaceCard>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-6">
              <SurfaceCard title="التعليقات" icon={MessageSquare}>
                <div className="space-y-4">
                  {commentsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <DSSkeleton key={i} className="h-16 rounded-lg" />
                      ))}
                    </div>
                  ) : !comments || comments.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="لا توجد تعليقات بعد"
                      description="كن أول من يبدأ النقاش"
                    />
                  ) : (
                    <div className="space-y-3">
                      {[...comments]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((comment: TaskComment) => (
                          <CommentCard key={comment.id} comment={comment} />
                        ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="pt-4 border-t border-portal-divider">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center font-semibold text-sm shrink-0">
                        {user.name?.charAt(0) ?? "؟"}
                      </div>
                      <div className="flex-1">
                        <textarea
                          className="w-full rounded-xl border border-portal-card-border bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary-500/20 transition-all"
                          rows={3}
                          placeholder="اكتب تعليقك هنا..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          disabled={isAddingComment}
                        />
                        <div className="flex justify-end mt-2">
                          <ActionButton
                            size="sm"
                            onClick={handleAddComment}
                            disabled={isAddingComment || !commentText.trim()}
                            icon={<Send className="w-4 h-4" />}
                          >
                            {isAddingComment ? "جارٍ الإرسال..." : "إرسال"}
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6">
              <SurfaceCard
                title="الملفات"
                icon={Paperclip}
                action={
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded-lg border border-portal-card-border bg-white px-2 text-xs"
                      value={filePurpose}
                      onChange={(e) => setFilePurpose(e.target.value as FilePurpose)}
                    >
                      {Object.values(FilePurpose).map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {FILE_PURPOSE_LABELS[purpose]}
                        </option>
                      ))}
                    </select>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <ActionButton
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      icon={<Upload className="w-4 h-4" />}
                    >
                      {isUploading ? "جارٍ الرفع..." : "رفع ملف"}
                    </ActionButton>
                  </div>
                }
              >
                {filesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <DSSkeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : !files || files.length === 0 ? (
                  <EmptyState
                    icon={Paperclip}
                    title="لا توجد ملفات"
                    description="ارفع ملفات لهذه المهمة"
                    actionLabel="رفع ملف"
                    onAction={() => fileInputRef.current?.click()}
                  />
                ) : (
                  <div className="space-y-2">
                    {files.map((file: TaskFile) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white border border-portal-card-border hover:shadow-sm transition-all"
                      >
                        <FileIcon mimeType={file.mimeType} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.fileName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neutral-400">{formatFileSize(file.fileSize)}</span>
                            <span className="text-xs text-neutral-300">•</span>
                            <span className="text-xs text-neutral-400">{formatShortDate(file.createdAt)}</span>
                            {file.purpose && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${FILE_PURPOSE_COLORS[file.purpose as FilePurpose]}`}>
                                {FILE_PURPOSE_LABELS[file.purpose as FilePurpose]}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            className="size-8"
                            onClick={async () => {
                              try {
                                await downloadTaskFile(id, file.id, file.fileName);
                              } catch {
                                toast.error("فشل تحميل الملف");
                              }
                            }}
                            icon={<Download className="w-4 h-4" />}
                          >
                            {""}
                          </ActionButton>
                          {(user.role === UserRole.ADMIN || user.role === UserRole.PM || user.id === (file as any).uploadedBy) && (
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              className="size-8 text-danger-500 hover:text-danger-600"
                              onClick={async () => {
                                try {
                                  await deleteFile({ taskId: id, fileId: file.id }).unwrap();
                                  toast.success("تم حذف الملف");
                                } catch {
                                  toast.error("فشل حذف الملف");
                                }
                              }}
                              icon={<Trash2 className="w-4 h-4" />}
                            >
                              {""}
                            </ActionButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SurfaceCard>
            </TabsContent>

            {/* Client Tab */}
            <TabsContent value="client" className="space-y-6">
              {teamView ? (
                <ClientBriefCompact
                  client={teamView.client}
                  profile={teamView.profile}
                  viewAs="internal"
                />
              ) : (
                <DSSkeleton className="h-96 rounded-xl" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right Sidebar (1/3) ────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <SurfaceCard title="معلومات المهمة" icon={Clock}>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">الحالة</span>
                <StatusBadge
                  status={
                    task.status === TaskStatus.DONE
                      ? "COMPLETED"
                      : task.status === TaskStatus.IN_REVIEW
                      ? "PENDING"
                      : task.status === TaskStatus.REVISION
                      ? "REJECTED"
                      : task.status === TaskStatus.IN_PROGRESS
                      ? "ACTIVE"
                      : "PENDING"
                  }
                  label={TASK_STATUS_LABELS[task.status as TaskStatus]}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">الأولوية</span>
                <span className={`text-sm font-medium ${
                  task.priority === TaskPriority.URGENT ? "text-rose-600" :
                  task.priority === TaskPriority.HIGH ? "text-amber-600" :
                  "text-neutral-600"
                }`}>
                  {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">القسم</span>
                <span className="text-sm font-medium text-natural-100">
                  {DEPARTMENT_LABELS[task.department?.name as TaskDepartment] ?? task.department?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">الاستحقاق</span>
                <span className="text-sm font-medium text-natural-100">{formatShortDate(task.dueDate)}</span>
              </div>
              {t.assignee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">المسند إليه</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-xs font-semibold">
                      {t.assignee.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{t.assignee.name}</span>
                  </div>
                </div>
              )}
              {t.project && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">المشروع</span>
                  <Link
                    href={`/dashboard/pm/projects/${t.project.id}`}
                    className="text-sm font-medium text-secondary-600 hover:underline"
                  >
                    {t.project.name}
                  </Link>
                </div>
              )}
            </div>
          </SurfaceCard>

          {/* Workflow History */}
          <SurfaceCard title="سجل الحالة" icon={CheckCircle2}>
            {!t.statusHistory || t.statusHistory.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">لا توجد انتقالات بعد</p>
            ) : (
              <div className="space-y-3">
                {[...t.statusHistory]
                  .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                  .map((entry, index) => (
                    <div key={entry.id} className="flex gap-3 relative">
                      {index < t.statusHistory!.length - 1 && (
                        <div className="absolute start-[15px] top-6 bottom-[-12px] w-px bg-neutral-200" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                        <ArrowLeft className="w-3.5 h-3.5 text-neutral-400 rotate-180" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="text-neutral-400">{TASK_STATUS_LABELS[entry.fromStatus]}</span>
                          <span className="text-neutral-300 mx-1">→</span>
                          <span className="font-medium text-natural-100">{TASK_STATUS_LABELS[entry.toStatus]}</span>
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {formatRelativeTime(entry.changedAt as string)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
