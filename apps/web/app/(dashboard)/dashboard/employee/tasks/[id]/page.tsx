"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Send,
  Paperclip,
  Upload,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { FileItem } from "@/components/dashboard/employee/FileItem";
import { CommentItem } from "@/components/dashboard/employee/CommentItem";
import { ClientBriefCompact } from "@/components/client-brief";
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
import { useGetClientTeamViewQuery } from "@/features/clients/clientsApi";
import { useAppSelector } from "@/lib/hooks";
import { formatRelativeTime, formatShortDate, daysUntil } from "@/lib/format";
import {
  TaskStatus,
  TaskPriority,
  TaskDepartment,
  UserRole,
  FilePurpose,
} from "@hassad/shared";
import { toast } from "sonner";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLOR,
  TASK_PRIORITY_LABELS,
} from "@/lib/utils/task-status";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

interface TaskWithMeta {
  project?: {
    id: string;
    name: string;
    clientId?: string;
    client?: { id: string; companyName: string };
  };
  assignee?: { id: string; name: string };
  statusHistory?: Array<{
    id: string;
    fromStatus: TaskStatus;
    toStatus: TaskStatus;
    changedAt: string | Date;
  }>;
}

// ── Label maps ────────────────────────────────────────────────────────────────

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

const STATUS_BADGE_MAP: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "PENDING",
  [TaskStatus.IN_PROGRESS]: "IN_PROGRESS",
  [TaskStatus.IN_REVIEW]: "PENDING",
  [TaskStatus.REVISION]: "REJECTED",
  [TaskStatus.DONE]: "COMPLETED",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAllowedTransitions(
  currentStatus: TaskStatus,
  role: UserRole,
): TaskStatus[] {
  if (role === UserRole.ADMIN) {
    return Object.values(TaskStatus).filter((s) => s !== currentStatus);
  }
  const transitions: Partial<
    Record<TaskStatus, Partial<Record<UserRole | string, TaskStatus[]>>>
  > = {
    [TaskStatus.TODO]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
    [TaskStatus.IN_PROGRESS]: { EMPLOYEE: [TaskStatus.IN_REVIEW] },
    [TaskStatus.IN_REVIEW]: { PM: [TaskStatus.DONE, TaskStatus.REVISION] },
    [TaskStatus.REVISION]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
  };
  return transitions[currentStatus]?.[role as string] ?? [];
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = use(params);
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: task, isLoading, isError } = useGetTaskByIdQuery(id);
  const { data: files, isLoading: filesLoading } = useGetTaskFilesQuery(id);
  const { data: comments, isLoading: commentsLoading } =
    useGetTaskCommentsQuery(id);

  const clientId =
    (task as any)?.project?.client?.id ??
    (task as any)?.project?.clientId ??
    "";
  const { data: teamView } = useGetClientTeamViewQuery(clientId, {
    skip: !clientId,
  });

  // Mutations
  const [startTask, { isLoading: isStarting }] = useStartTaskMutation();
  const [submitTask, { isLoading: isSubmitting }] = useSubmitTaskMutation();
  const [approveTask, { isLoading: isApproving }] = useApproveTaskMutation();
  const [rejectTask, { isLoading: isRejecting }] = useRejectTaskMutation();
  const isUpdatingStatus =
    isStarting || isSubmitting || isApproving || isRejecting;

  const [uploadFile, { isLoading: isUploading }] = useUploadTaskFileMutation();
  const [deleteFile, { isLoading: isDeletingFile }] =
    useDeleteTaskFileMutation();
  const [addComment, { isLoading: isAddingComment }] =
    useAddTaskCommentMutation();

  // Local state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [filePurpose, setFilePurpose] = useState<FilePurpose>(
    FilePurpose.REFERENCE,
  );

  if (!user) return null;

  // ── Loading skeleton ────────────────────────────────────────────────────

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

  // ── Error / not found ───────────────────────────────────────────────────

  if (isError || !task) {
    return (
      <EmptyState
        title="المهمة غير موجودة"
        description="لا يمكن الوصول إلى هذه المهمة. ربما تم حذفها أو ليس لديك صلاحية."
        actionLabel="العودة للوحة"
        actionHref="/dashboard/employee"
      />
    );
  }

  const t = task as typeof task & TaskWithMeta;
  const allowedTransitions = getAllowedTransitions(task.status, user.role);
  const totalComments = comments?.length ?? 0;
  const totalFiles = files?.length ?? 0;
  const overdueDays = daysUntil(task.dueDate);

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleStatusUpdate(newStatus: TaskStatus) {
    try {
      if (newStatus === TaskStatus.IN_PROGRESS) {
        await startTask(id).unwrap();
      } else if (newStatus === TaskStatus.IN_REVIEW) {
        await submitTask(id).unwrap();
      } else if (newStatus === TaskStatus.DONE) {
        await approveTask(id).unwrap();
      } else if (newStatus === TaskStatus.REVISION) {
        await rejectTask(id).unwrap();
      }
      toast.success(`تم تحديث الحالة إلى "${TASK_STATUS_LABELS[newStatus]}"`);
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

  async function handleDeleteFile(fileId: string) {
    try {
      await deleteFile({ taskId: id, fileId }).unwrap();
      toast.success("تم حذف الملف");
    } catch {
      toast.error("فشل حذف الملف");
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

  const canDeleteFile = (uploadedById: string) =>
    user.role === UserRole.ADMIN ||
    user.role === UserRole.PM ||
    user.id === uploadedById;

  // ── Action button config ────────────────────────────────────────────────

  const nextStatus = allowedTransitions[0];
  const actionLabel = nextStatus ? TASK_STATUS_LABELS[nextStatus] : "";
  const isActionable =
    allowedTransitions.length > 0 &&
    task.status !== TaskStatus.IN_REVIEW &&
    task.status !== TaskStatus.DONE;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/employee"
            className="p-2 -ms-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            {t.project && (
              <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Link
                  href="/dashboard/employee"
                  className="hover:text-secondary-500 transition-colors"
                >
                  لوحة الموظف
                </Link>
                <span>/</span>
                <span className="text-natural-100 truncate max-w-[200px]">
                  {task.title}
                </span>
              </nav>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <h1 className="text-xl font-bold text-natural-100">
                {task.title}
              </h1>
              <StatusBadge
                status={STATUS_BADGE_MAP[task.status]}
                label={TASK_STATUS_LABELS[task.status]}
              />
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full border",
                  task.priority === TaskPriority.URGENT
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : task.priority === TaskPriority.HIGH
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200",
                )}
              >
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
              {typeof task.revisionCount === "number" &&
                task.revisionCount > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    تعديل {task.revisionCount}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2/3) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="gap-2">
                <FileText className="w-4 h-4" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <Paperclip className="w-4 h-4" />
                الملفات
                {totalFiles > 0 && (
                  <span className="mr-1 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">
                    {totalFiles}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                التعليقات
                {totalComments > 0 && (
                  <span className="mr-1 text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">
                    {totalComments}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="client" className="gap-2">
                <User className="w-4 h-4" />
                تفاصيل العميل
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
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

              <SurfaceCard
                title="الملفات"
                icon={Paperclip}
                action={
                  totalFiles > 0 && (
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("files")}
                    >
                      عرض الكل
                    </ActionButton>
                  )
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
                    {files.slice(0, 3).map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        taskId={id}
                        canDelete={canDeleteFile(file.uploadedBy)}
                        onDelete={handleDeleteFile}
                        isDeleting={isDeletingFile}
                      />
                    ))}
                  </div>
                )}
              </SurfaceCard>

              <SurfaceCard
                title="آخر التعليقات"
                icon={MessageSquare}
                action={
                  totalComments > 0 && (
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("comments")}
                    >
                      عرض الكل
                    </ActionButton>
                  )
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
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .slice(0, 2)
                      .map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                  </div>
                )}
              </SurfaceCard>
            </TabsContent>

            {/* ── Files Tab ─────────────────────────────────────────── */}
            <TabsContent value="files" className="space-y-6">
              <SurfaceCard
                title="الملفات"
                icon={Paperclip}
                action={
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded-lg border border-portal-card-border bg-white px-2 text-xs"
                      value={filePurpose}
                      onChange={(e) =>
                        setFilePurpose(e.target.value as FilePurpose)
                      }
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
                      disabled={isUploading}
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
                  />
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        taskId={id}
                        canDelete={canDeleteFile(file.uploadedBy)}
                        onDelete={handleDeleteFile}
                        isDeleting={isDeletingFile}
                      />
                    ))}
                  </div>
                )}
              </SurfaceCard>
            </TabsContent>

            {/* ── Comments Tab ──────────────────────────────────────── */}
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
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )
                        .map((comment) => (
                          <CommentItem key={comment.id} comment={comment} />
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

            {/* ── Client Tab ─────────────────────────────────────────────── */}
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

        {/* ── Right Sidebar (1/3) ─────────────────────────────────── */}
        <div className="space-y-6">
          {/* Primary Action */}
          <SurfaceCard contentClassName="p-5">
            <div className="flex flex-col items-center gap-3 text-center">
              {task.status === TaskStatus.DONE ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-emerald-700">
                    تم إنجاز المهمة
                  </p>
                </>
              ) : task.status === TaskStatus.IN_REVIEW ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-neutral-500">
                    بانتظار موافقة المدير
                  </p>
                </>
              ) : isActionable ? (
                <ActionButton
                  size="lg"
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={isUpdatingStatus}
                  className={cn(
                    "w-full rounded-xl px-6 py-3 text-base font-semibold",
                    nextStatus === TaskStatus.IN_PROGRESS &&
                      "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500",
                    nextStatus === TaskStatus.IN_REVIEW &&
                      "bg-purple-500 hover:bg-purple-600 text-white border-purple-500",
                    nextStatus === TaskStatus.REVISION &&
                      "bg-amber-500 hover:bg-amber-600 text-white border-amber-500",
                  )}
                >
                  {isUpdatingStatus ? "جارٍ التحديث..." : actionLabel}
                </ActionButton>
              ) : (
                <p className="text-sm text-neutral-400">لا يوجد إجراء متاح</p>
              )}
            </div>
          </SurfaceCard>

          {/* Quick Info */}
          <SurfaceCard title="معلومات المهمة" icon={Clock}>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">الحالة</span>
                <StatusBadge
                  status={STATUS_BADGE_MAP[task.status]}
                  label={TASK_STATUS_LABELS[task.status]}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">الأولوية</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    task.priority === TaskPriority.URGENT
                      ? "text-rose-600"
                      : task.priority === TaskPriority.HIGH
                        ? "text-amber-600"
                        : "text-neutral-600",
                  )}
                >
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">الاستحقاق</span>
                <div className="flex flex-col items-end">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      overdueDays != null && overdueDays < 0
                        ? "text-danger-600"
                        : "text-natural-100",
                    )}
                  >
                    {formatShortDate(task.dueDate)}
                  </span>
                  {overdueDays != null && overdueDays < 0 && (
                    <span className="text-[11px] text-danger-500 font-medium">
                      متأخرة {Math.abs(overdueDays)}{" "}
                      {Math.abs(overdueDays) === 1 ? "يوم" : "أيام"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">القسم</span>
                <span className="text-sm font-medium text-natural-100">
                  {DEPARTMENT_LABELS[task.department?.name as TaskDepartment] ??
                    task.department?.name ??
                    "—"}
                </span>
              </div>

              {t.project && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">المشروع</span>
                  <span className="text-sm font-medium text-secondary-600">
                    {t.project.name}
                  </span>
                </div>
              )}

              {t.assignee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">المسند إليه</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center text-xs font-semibold">
                      {t.assignee.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">
                      {t.assignee.name}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">تاريخ الإنشاء</span>
                <span className="text-sm font-medium text-natural-100">
                  {formatShortDate(task.createdAt)}
                </span>
              </div>

              {typeof task.revisionCount === "number" &&
                task.revisionCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">طلبات التعديل</span>
                    <span className="text-sm font-medium text-danger-600">
                      {task.revisionCount}
                    </span>
                  </div>
                )}
            </div>
          </SurfaceCard>

          {/* Workflow History */}
          <SurfaceCard title="سجل الحالة" icon={Clock}>
            {!t.statusHistory || t.statusHistory.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-4">
                لا توجد انتقالات بعد
              </p>
            ) : (
              <div className="space-y-3">
                {[...t.statusHistory]
                  .sort(
                    (a, b) =>
                      new Date(b.changedAt).getTime() -
                      new Date(a.changedAt).getTime(),
                  )
                  .map((entry, index, arr) => (
                    <div key={entry.id} className="flex gap-3 relative">
                      {index < arr.length - 1 && (
                        <div className="absolute start-[15px] top-6 bottom-[-12px] w-px bg-neutral-200" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                        <ArrowLeft className="w-3.5 h-3.5 text-neutral-400 rotate-180" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="text-neutral-400">
                            {TASK_STATUS_LABELS[entry.fromStatus]}
                          </span>
                          <span className="text-neutral-300 mx-1">←</span>
                          <span className="font-medium text-natural-100">
                            {TASK_STATUS_LABELS[entry.toStatus]}
                          </span>
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
