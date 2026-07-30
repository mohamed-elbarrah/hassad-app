"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  Download,
  FolderKanban,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  Upload,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  FilePurpose,
  TaskDepartment,
  TaskPriority,
  TaskStatus,
  UserRole,
  type TaskComment,
  type TaskFile,
} from "@hassad/shared";
import { buildDefaultClientStats, ClientContextPanel } from "@/components/client-detail/ClientDetailPattern";
import { TaskWorkflowStepper } from "@/components/dashboard/pm/TaskWorkflowStepper";
import { useMarketingTaskExtraTabs } from "@/components/task-detail/MarketingTaskExtras";
import {
  buildTaskLifecycleFields,
  buildTaskOperationalFields,
  buildTaskStats,
  TaskCommentsTable,
  TaskDetailLoading,
  TaskFilesTable,
  TaskHistoryTable,
  TaskInfoGrid,
  TaskInlineMeta,
  TaskStatsGrid,
  TaskSummaryCard,
  TaskTabsCard,
  type TaskCommentRecord,
  type TaskDetailEntity,
  type TaskFileRecord,
  type TaskHistoryRecord,
  type TaskTabItem,
} from "@/components/task-detail/TaskDetailPattern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { downloadTaskFile } from "@/lib/downloadFile";
import { useAppSelector } from "@/lib/hooks";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/utils/task-status";
import { useGetClientTeamViewQuery } from "@/features/clients/clientsApi";
import {
  useAddTaskCommentMutation,
  useApproveTaskMutation,
  useDeleteTaskFileMutation,
  useGetTaskByIdQuery,
  useGetTaskCommentsQuery,
  useGetTaskFilesQuery,
  useRejectTaskMutation,
  useStartTaskMutation,
  useSubmitTaskMutation,
  useUploadTaskFileMutation,
} from "@/features/tasks/tasksApi";

const FILE_PURPOSE_LABELS: Record<FilePurpose, string> = {
  [FilePurpose.DELIVERABLE]: "تسليم نهائي",
  [FilePurpose.REFERENCE]: "مرجع",
  [FilePurpose.INTERNAL_DRAFT]: "مسودة داخلية",
};

const DEPARTMENT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "التصميم",
  [TaskDepartment.MARKETING]: "التسويق",
  [TaskDepartment.DEVELOPMENT]: "التطوير",
  [TaskDepartment.CONTENT]: "المحتوى",
  [TaskDepartment.PRODUCTION]: "المونتاج",
};

interface TaskWorkspaceDetailProps {
  taskId: string;
  listHref: string;
  listLabel: string;
  rootHref: string;
  rootLabel: string;
  includeMarketingExtras?: boolean;
  canManageMarketingExtras?: boolean;
}

function mapTaskEntity(task: any): TaskDetailEntity {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: String(task.dueDate),
    startedAt: task.startedAt ? String(task.startedAt) : null,
    submittedAt: task.submittedAt ? String(task.submittedAt) : null,
    approvedAt: task.approvedAt ? String(task.approvedAt) : null,
    archivedAt: task.archivedAt ? String(task.archivedAt) : null,
    createdAt: task.createdAt ? String(task.createdAt) : null,
    updatedAt: task.updatedAt ? String(task.updatedAt) : null,
    revisionCount: task.revisionCount ?? 0,
    isVisibleToClient: task.isVisibleToClient ?? null,
    project: task.project
      ? {
          id: task.project.id,
          name: task.project.name,
          clientName: task.project.client?.companyName ?? null,
        }
      : null,
    departmentName: task.department?.name
      ? DEPARTMENT_LABELS[task.department.name as TaskDepartment] || task.department.name
      : null,
    assigneeName: task.assignee?.name ?? null,
    creatorName: task.creator?.name ?? null,
  };
}

function mapHistory(history?: any[]): TaskHistoryRecord[] {
  return (history ?? []).map((entry) => ({
    id: entry.id,
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    changedAt: entry.changedAt ? String(entry.changedAt) : null,
    changerName: entry.changer?.name ?? null,
  }));
}

function mapComments(comments?: TaskComment[]): TaskCommentRecord[] {
  return (comments ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime(),
    )
    .map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt ? String(comment.createdAt) : null,
      userName: comment.user?.name ?? null,
    }));
}

function mapFiles(files?: TaskFile[]): TaskFileRecord[] {
  return (files ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime(),
    )
    .map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileType: file.mimeType,
      fileSize: file.fileSize,
      uploadedAt: file.createdAt ? String(file.createdAt) : null,
      purposeLabel: file.purpose
        ? FILE_PURPOSE_LABELS[file.purpose as FilePurpose] || file.purpose
        : null,
    }));
}

function ErrorState({
  listHref,
  listLabel,
}: {
  listHref: string;
  listLabel: string;
}) {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <Card>
        <CardContent className="p-8">
          <Empty>
            <EmptyMedia variant="icon">
              <FolderKanban />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>المهمة غير موجودة</EmptyTitle>
              <EmptyDescription>
                تعذّر الوصول إلى هذه المهمة أو لم تعد متاحة لهذا الدور.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href={listHref}>
                  <ArrowLeft data-icon="inline-start" />
                  العودة إلى {listLabel}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}

export function TaskWorkspaceDetail({
  taskId,
  listHref,
  listLabel,
  rootHref,
  rootLabel,
  includeMarketingExtras = false,
  canManageMarketingExtras = false,
}: TaskWorkspaceDetailProps) {
  const { user } = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [filePurpose, setFilePurpose] = useState<FilePurpose>(FilePurpose.REFERENCE);
  const marketingTabs = useMarketingTaskExtraTabs({
    taskId,
    canManage: canManageMarketingExtras,
    enabled: includeMarketingExtras,
  });

  const { data: task, isLoading, isError } = useGetTaskByIdQuery(taskId);
  const { data: files, isLoading: filesLoading } = useGetTaskFilesQuery(taskId);
  const { data: comments, isLoading: commentsLoading } = useGetTaskCommentsQuery(taskId);

  const clientId = (task as any)?.project?.client?.id ?? (task as any)?.project?.clientId ?? "";
  const { data: teamView } = useGetClientTeamViewQuery(clientId, {
    skip: !clientId,
  });

  const [startTask] = useStartTaskMutation();
  const [submitTask] = useSubmitTaskMutation();
  const [approveTask] = useApproveTaskMutation();
  const [rejectTask] = useRejectTaskMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadTaskFileMutation();
  const [deleteFile, { isLoading: isDeletingFile }] = useDeleteTaskFileMutation();
  const [addComment, { isLoading: isAddingComment }] = useAddTaskCommentMutation();

  if (!user) return null;
  if (isLoading) return <TaskDetailLoading />;
  if (isError || !task) return <ErrorState listHref={listHref} listLabel={listLabel} />;

  const taskEntity = mapTaskEntity(task);
  const isMarketingTask = task.department?.name === TaskDepartment.MARKETING;
  const commentsData = mapComments(comments);
  const filesData = mapFiles(files);
  const historyData = mapHistory((task as any).statusHistory);

  const isPmReviewer = user.role === UserRole.PM || user.role === UserRole.ADMIN;
  const canReview = isPmReviewer && task.status === TaskStatus.IN_REVIEW;
  const canStart = !isPmReviewer && [TaskStatus.TODO, TaskStatus.REVISION].includes(task.status);
  const canSubmit = !isPmReviewer && task.status === TaskStatus.IN_PROGRESS;

  const stats = buildTaskStats({
    status: task.status,
    priority: task.priority,
    revisionCount: task.revisionCount ?? 0,
    dueDateLabel: formatDateTime(task.dueDate) || "—",
    commentsCount: commentsData.length,
    filesCount: filesData.length,
  });

  async function runStatusAction(action: "start" | "submit" | "approve" | "reject") {
    try {
      if (action === "start") await startTask(taskId).unwrap();
      if (action === "submit") await submitTask(taskId).unwrap();
      if (action === "approve") await approveTask(taskId).unwrap();
      if (action === "reject") await rejectTask(taskId).unwrap();
      toast.success("تم تحديث حالة المهمة");
    } catch {
      toast.error("فشل تحديث حالة المهمة");
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile({ taskId, file, purpose: filePurpose }).unwrap();
      toast.success("تم رفع الملف");
    } catch {
      toast.error("فشل رفع الملف");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteFile(fileId: string) {
    try {
      await deleteFile({ taskId, fileId }).unwrap();
      toast.success("تم حذف الملف");
    } catch {
      toast.error("فشل حذف الملف");
    }
  }

  async function handleAddComment() {
    const value = commentText.trim();
    if (!value) return;
    try {
      await addComment({ taskId, content: value }).unwrap();
      setCommentText("");
      toast.success("تمت إضافة التعليق");
    } catch {
      toast.error("فشل إضافة التعليق");
    }
  }

  const actions = (
    <>
      {canReview ? (
        <>
          <Button onClick={() => runStatusAction("approve")}>
            <Check data-icon="inline-start" />
            اعتماد وإنجاز
          </Button>
          <Button variant="outline" onClick={() => runStatusAction("reject")}>
            <X data-icon="inline-start" />
            طلب تعديل
          </Button>
        </>
      ) : null}
      {canStart ? (
        <Button onClick={() => runStatusAction("start")}>
          <RotateCcw data-icon="inline-start" />
          {task.status === TaskStatus.REVISION ? "بدء العمل مجددًا" : "بدء العمل"}
        </Button>
      ) : null}
      {canSubmit ? (
        <Button onClick={() => runStatusAction("submit")}>
          <Send data-icon="inline-start" />
          إرسال للمراجعة
        </Button>
      ) : null}
    </>
  );

  const tabs: TaskTabItem[] = [
    {
      value: "overview",
      label: "نظرة عامة",
      icon: FolderKanban,
      content: (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-6">
            <TaskInfoGrid
              title="البيانات التشغيلية"
              description="مرجع التنفيذ والمتابعة اليومية."
              fields={buildTaskOperationalFields(taskEntity)}
            />
            <TaskInfoGrid
              title="الوصف والمراحل"
              description="ملخص التنفيذ والموافقات المرتبطة."
              fields={buildTaskLifecycleFields(taskEntity)}
            />
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="gap-2">
                <CardTitle>سياق المهمة</CardTitle>
                <CardDescription>عناصر سريعة تساعد الفريق أثناء التنفيذ.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {task.project?.name ? (
                  <TaskInlineMeta
                    icon={FolderKanban}
                    label="المشروع"
                    value={task.project.name}
                  />
                ) : null}
                <TaskInlineMeta
                  icon={Calendar}
                  label="الاستحقاق"
                  value={formatDateTime(task.dueDate) || "—"}
                />
                <TaskInlineMeta
                  icon={User}
                  label="المكلّف"
                  value={task.assignee?.name || "غير محدد"}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-2">
                <CardTitle>آخر التعليقات</CardTitle>
                <CardDescription>أحدث ما تم توثيقه على المهمة.</CardDescription>
              </CardHeader>
              <CardContent>
                {commentsLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                  </div>
                ) : (
                  <TaskCommentsTable comments={commentsData.slice(0, 3)} compact />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-2">
                <CardTitle>آخر الملفات</CardTitle>
                <CardDescription>أحدث الملفات المرتبطة بالمهمة.</CardDescription>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                ) : (
                  <TaskFilesTable files={filesData.slice(0, 3)} compact />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      value: "comments",
      label: "التعليقات",
      icon: MessageSquare,
      badge: String(commentsData.length),
      content: (
        <div className="flex flex-col gap-6">
          {commentsLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : (
            <TaskCommentsTable comments={commentsData} compact />
          )}

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">إضافة تعليق</h3>
                <p className="text-sm text-muted-foreground">
                  استخدم التعليقات لتوثيق القرار أو طلب التوضيح.
                </p>
              </div>
              <Badge variant="outline">{user.name}</Badge>
            </div>
            <Textarea
              rows={4}
              placeholder="اكتب تعليقك هنا..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              disabled={isAddingComment}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={isAddingComment || !commentText.trim()}>
                <Send data-icon="inline-start" />
                {isAddingComment ? "جارٍ الإرسال..." : "إرسال"}
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      value: "files",
      label: "الملفات",
      icon: Paperclip,
      badge: String(filesData.length),
      content: (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-sm font-medium">إدارة ملفات المهمة</h3>
              <p className="text-sm text-muted-foreground">
                ارفع الملفات المناسبة وحدد نوعها لتسهيل المتابعة.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={filePurpose}
                onValueChange={(value) => setFilePurpose(value as FilePurpose)}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FilePurpose).map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {FILE_PURPOSE_LABELS[purpose]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload data-icon="inline-start" />
                {isUploading ? "جارٍ الرفع..." : "رفع ملف"}
              </Button>
            </div>
          </div>

          {filesLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ) : filesData.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Paperclip />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>لا توجد ملفات</EmptyTitle>
                    <EmptyDescription>ابدأ برفع أول ملف مرتبط بهذه المهمة.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.fileName}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{formatShortDate(file.createdAt)}</span>
                        <span>{(file.fileSize ?? 0) > 0 ? `${Math.round((file.fileSize ?? 0) / 1024)} KB` : "—"}</span>
                        {file.purpose ? (
                          <span>{FILE_PURPOSE_LABELS[file.purpose as FilePurpose] || file.purpose}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await downloadTaskFile(taskId, file.id, file.fileName);
                          } catch {
                            toast.error("فشل تحميل الملف");
                          }
                        }}
                      >
                        <Download data-icon="inline-start" />
                        تحميل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={isDeletingFile}
                      >
                        <X data-icon="inline-start" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      value: "history",
      label: "سجل الحالة",
      icon: Calendar,
      badge: String(historyData.length),
      content: <TaskHistoryTable history={historyData} />,
    },
  ];

  if (teamView) {
    tabs.push({
      value: "client",
      label: "العميل",
      icon: User,
      content: (
        <ClientContextPanel
          client={teamView.client}
          profile={teamView.profile}
          mode="internal"
          stats={buildDefaultClientStats(teamView.client, "internal")}
        />
      ),
    });
  }

  if (includeMarketingExtras && isMarketingTask) {
    tabs.splice(1, 0, ...marketingTabs);
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={rootHref}>{rootLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={listHref}>{listLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {task.project?.name ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{task.project.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{task.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <TaskSummaryCard
          task={taskEntity}
          badges={[
            task.project?.client?.companyName ? (
              <Badge key="client" variant="outline">
                {task.project.client.companyName}
              </Badge>
            ) : null,
          ].filter(Boolean)}
          actions={actions}
        />
      </div>

      <TaskStatsGrid stats={stats} />

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>مسار التنفيذ</CardTitle>
          <CardDescription>يتتبع موقع المهمة ضمن سير العمل الحالي.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TaskWorkflowStepper
            currentStatus={task.status as TaskStatus}
            revisionCount={task.revisionCount ?? 0}
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {TASK_STATUS_LABELS[task.status as TaskStatus]}
            </Badge>
            <Badge variant="outline">
              {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
            </Badge>
            {task.dueDate ? (
              <Badge variant="outline">
                الاستحقاق: {formatDateTime(task.dueDate)}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <TaskTabsCard defaultValue="overview" tabs={tabs} />
    </div>
  );
}
