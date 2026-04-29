"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Paperclip, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FileItem } from "@/components/dashboard/employee/FileItem";
import { CommentItem } from "@/components/dashboard/employee/CommentItem";
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
import { useAppSelector } from "@/lib/hooks";
import {
  TaskStatus,
  TaskPriority,
  TaskDepartment,
  UserRole,
  FilePurpose,
} from "@hassad/shared";
import { toast } from "sonner";

// Allowed status transitions per role (mirrors API workflow)
const TASK_STATUS_TRANSITIONS: Partial<Record<TaskStatus, Partial<Record<UserRole, TaskStatus[]>>>> = {
  [TaskStatus.TODO]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
  [TaskStatus.IN_PROGRESS]: { EMPLOYEE: [TaskStatus.IN_REVIEW] },
  [TaskStatus.IN_REVIEW]: {
    PM: [TaskStatus.DONE, TaskStatus.REVISION],
  },
  [TaskStatus.REVISION]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
};

// ── Label maps ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "للتنفيذ",
  [TaskStatus.IN_PROGRESS]: "قيد التنفيذ",
  [TaskStatus.IN_REVIEW]: "قيد المراجعة",
  [TaskStatus.REVISION]: "يحتاج تعديل",
  [TaskStatus.DONE]: "منجز",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

const DEPARTMENT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "التصميم",
  [TaskDepartment.MARKETING]: "التسويق",
  [TaskDepartment.DEVELOPMENT]: "التطوير",
  [TaskDepartment.CONTENT]: "المحتوى",
  [TaskDepartment.PRODUCTION]: "المونتاج",
};

const STATUS_VARIANT: Record<
  TaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [TaskStatus.TODO]: "secondary",
  [TaskStatus.IN_PROGRESS]: "default",
  [TaskStatus.IN_REVIEW]: "outline",
  [TaskStatus.REVISION]: "destructive",
  [TaskStatus.DONE]: "secondary",
};

const PRIORITY_VARIANT: Record<
  TaskPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [TaskPriority.LOW]: "secondary",
  [TaskPriority.NORMAL]: "outline",
  [TaskPriority.HIGH]: "default",
  [TaskPriority.URGENT]: "destructive",
};

const FILE_PURPOSE_LABELS: Record<FilePurpose, string> = {
  [FilePurpose.DELIVERABLE]: "تسليم نهائي",
  [FilePurpose.REFERENCE]: "مرجع",
  [FilePurpose.INTERNAL_DRAFT]: "مسودة داخلية",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAllowedTransitions(
  currentStatus: TaskStatus,
  role: UserRole,
): TaskStatus[] {
  if (role === UserRole.ADMIN) {
    return Object.values(TaskStatus).filter((s) => s !== currentStatus);
  }
  if (role === UserRole.PM || role === UserRole.EMPLOYEE) {
    return (
      TASK_STATUS_TRANSITIONS[currentStatus]?.[
        role as string
      ] ?? []
    );
  }
  return [];
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = use(params);
  const { user } = useAppSelector((state) => state.auth);

  const { data: task, isLoading, isError } = useGetTaskByIdQuery(id);
  const { data: files, isLoading: filesLoading } = useGetTaskFilesQuery(id);
  const { data: comments, isLoading: commentsLoading } =
    useGetTaskCommentsQuery(id);

  const [startTask, { isLoading: isStarting }] = useStartTaskMutation();
  const [submitTask, { isLoading: isSubmitting }] = useSubmitTaskMutation();
  const [approveTask, { isLoading: isApproving }] = useApproveTaskMutation();
  const [rejectTask, { isLoading: isRejecting }] = useRejectTaskMutation();
  const isUpdatingStatus = isStarting || isSubmitting || isApproving || isRejecting;
  const [uploadFile, { isLoading: isUploading }] = useUploadTaskFileMutation();
  const [deleteFile, { isLoading: isDeletingFile }] =
    useDeleteTaskFileMutation();
  const [addComment, { isLoading: isAddingComment }] =
    useAddTaskCommentMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [filePurpose, setFilePurpose] = useState<FilePurpose>(
    FilePurpose.DELIVERABLE,
  );

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/employee">
          <Button variant="ghost" size="sm">
            <ArrowRight className="size-4 mr-1" />
            العودة
          </Button>
        </Link>
        <p className="text-destructive">
          المهمة غير موجودة أو لا يمكن الوصول إليها.
        </p>
      </div>
    );
  }

  const allowedTransitions = getAllowedTransitions(task.status, user.role);

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
      toast.success(`تم تحديث الحالة إلى "${STATUS_LABELS[newStatus]}"`);
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
      toast.success("تمت إضافة التعليق");
    } catch {
      toast.error("فشل إضافة التعليق");
    }
  }

  const canDeleteFile = (uploadedById: string) =>
    user.role === UserRole.ADMIN ||
    user.role === UserRole.PM ||
    user.id === uploadedById;

  const taskWithRelations = task as typeof task & {
    project?: { id: string; name: string };
    assignee?: { id: string; name: string };
    statusHistory?: Array<{
      id: string;
      fromStatus: TaskStatus;
      toStatus: TaskStatus;
      changedAt: string | Date;
    }>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back navigation */}
      <Link href="/dashboard/employee">
        <Button variant="ghost" size="sm">
          <ArrowRight className="size-4 mr-1" />
          العودة
        </Button>
      </Link>

      {/* Task header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant={STATUS_VARIANT[task.status]}>
            {STATUS_LABELS[task.status]}
          </Badge>
          <Badge variant={PRIORITY_VARIANT[task.priority]}>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          {typeof task.revisionCount === "number" && task.revisionCount > 0 && (
            <Badge variant="destructive">طلبات تعديل: {task.revisionCount}</Badge>
          )}
        </div>
      </div>

      {/* Task details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تفاصيل المهمة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {task.description && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground text-xs mb-1">الوصف</p>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          {taskWithRelations.project && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">المشروع</p>
              <p className="font-medium">{taskWithRelations.project.name}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs mb-1">القسم</p>
            <p className="font-medium">
              {DEPARTMENT_LABELS[task.department?.name as TaskDepartment] ??
                task.department?.name ??
                "—"}
            </p>
          </div>
          {taskWithRelations.assignee && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">المسند إليه</p>
              <p className="font-medium">{taskWithRelations.assignee.name}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs mb-1">
              تاريخ الاستحقاق
            </p>
            <p className="font-medium">
              {new Date(task.dueDate).toLocaleDateString("ar-SA")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل انتقال الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          {!taskWithRelations.statusHistory ||
          taskWithRelations.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد انتقالات بعد.</p>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {[...taskWithRelations.statusHistory]
                .sort(
                  (a, b) =>
                    new Date(b.changedAt).getTime() -
                    new Date(a.changedAt).getTime(),
                )
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border px-3 py-2 flex items-center justify-between"
                  >
                    <p className="font-medium">
                      {STATUS_LABELS[entry.fromStatus]} ← {STATUS_LABELS[entry.toStatus]}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {new Date(entry.changedAt).toLocaleString("ar-SA")}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status update */}
      {allowedTransitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تحديث الحالة</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {allowedTransitions.map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(status)}
                disabled={isUpdatingStatus}
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Files */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="size-4" />
            الملفات
          </CardTitle>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">نوع الملف</label>
            <select
              className="h-8 rounded-md border bg-background px-2 text-xs"
              value={filePurpose}
              onChange={(e) => setFilePurpose(e.target.value as FilePurpose)}
              disabled={isUploading}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="size-3.5 mr-1" />
              {isUploading ? "جارٍ الرفع..." : "رفع ملف"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
          ) : !files || files.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا توجد ملفات مرفقة.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
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
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">التعليقات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {commentsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          ) : !comments || comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا توجد تعليقات بعد.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {[...comments]
                .sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
                )
                .map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Textarea
              placeholder="اكتب تعليقًا..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              disabled={isAddingComment}
            />
            <Button
              size="sm"
              className="self-end"
              onClick={handleAddComment}
              disabled={isAddingComment || !commentText.trim()}
            >
              {isAddingComment ? "جارٍ الإرسال..." : "إرسال"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
