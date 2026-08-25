"use client";

import type { ReactNode } from "react";
import {
  Calendar,
  Clock3,
  FileText,
  FolderKanban,
  MessageSquare,
  Paperclip,
  SquareCheckBig,
  User,
} from "lucide-react";
import { TaskPriority, TaskStatus } from "@hassad/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateTime,
  formatFileSize,
  formatNumber,
  formatRelativeTime,
} from "@/lib/format";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/utils/task-status";

export interface TaskDetailEntity {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  revisionCount?: number | null;
  isVisibleToClient?: boolean | null;
  project?: {
    id: string;
    name: string;
    clientName?: string | null;
  } | null;
  departmentName?: string | null;
  assigneeName?: string | null;
  creatorName?: string | null;
}

export interface TaskStatItem {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface TaskInfoFieldItem {
  label: string;
  value?: string | null;
}

export interface TaskHistoryRecord {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  changedAt?: string | null;
  changerName?: string | null;
}

export interface TaskCommentRecord {
  id: string;
  content: string;
  createdAt?: string | null;
  userName?: string | null;
}

export interface TaskFileRecord {
  id: string;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedAt?: string | null;
  purposeLabel?: string | null;
}

export interface TaskTabItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  content: ReactNode;
}

function toTaskStatus(status?: string | null) {
  return status as TaskStatus | undefined;
}

function toTaskPriority(priority?: string | null) {
  return priority as TaskPriority | undefined;
}

export function taskStatusVariant(status?: string | null) {
  switch (status) {
    case TaskStatus.DONE:
      return "secondary";
    case TaskStatus.REVISION:
      return "destructive";
    case TaskStatus.IN_PROGRESS:
      return "default";
    default:
      return "outline";
  }
}

export function taskPriorityVariant(priority?: string | null) {
  switch (priority) {
    case TaskPriority.URGENT:
      return "destructive";
    case TaskPriority.HIGH:
      return "default";
    default:
      return "outline";
  }
}

function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Empty className="border bg-muted/20 p-8">
      <EmptyMedia variant="icon">
        <SquareCheckBig />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function TaskDetailLoading() {
  return (
    <div className="flex flex-col gap-6   " dir="rtl">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <Skeleton className="size-20 rounded-lg" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-4 w-72" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

export function TaskSummaryCard({
  task,
  badges = [],
  actions,
}: {
  task: TaskDetailEntity;
  badges?: ReactNode[];
  actions?: ReactNode;
}) {
  const status = toTaskStatus(task.status);
  const priority = toTaskPriority(task.priority);

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex size-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <SquareCheckBig className="size-10" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-semibold tracking-tight">
                  {task.title}
                </h2>
                <Badge variant={taskStatusVariant(task.status)}>
                  {status ? TASK_STATUS_LABELS[status] : task.status}
                </Badge>
                <Badge variant={taskPriorityVariant(task.priority)}>
                  {priority ? TASK_PRIORITY_LABELS[priority] : task.priority}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {task.description ||
                  "تفاصيل التنفيذ والمراجعة والتسليم لهذه المهمة."}
              </p>
            </div>
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {task.project?.name ? (
            <Badge variant="outline">المشروع: {task.project.name}</Badge>
          ) : null}
          {task.assigneeName ? (
            <Badge variant="outline">المكلّف: {task.assigneeName}</Badge>
          ) : null}
          {typeof task.revisionCount === "number" ? (
            <Badge variant="outline">
              التعديلات: {formatNumber(task.revisionCount)}
            </Badge>
          ) : null}
          {typeof task.isVisibleToClient === "boolean" ? (
            <Badge variant="outline">
              مرئي للعميل: {task.isVisibleToClient ? "نعم" : "لا"}
            </Badge>
          ) : null}
          {badges}
        </div>
      </CardContent>
    </Card>
  );
}

export function TaskStatsGrid({
  stats,
  compact = false,
}: {
  stats: TaskStatItem[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {stats.map((item) => (
          <div
            key={item.label}
            className="flex min-w-0 flex-col gap-1 border-b pb-3"
          >
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
              <span className="text-lg font-semibold">{item.value}</span>
              {item.hint ? (
                <span className="text-sm text-muted-foreground">
                  {item.hint}
                </span>
              ) : null}
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <item.icon />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function buildTaskStats({
  status,
  priority,
  revisionCount,
  dueDateLabel,
  commentsCount,
  filesCount,
}: {
  status: string;
  priority: string;
  revisionCount: number;
  dueDateLabel: string;
  commentsCount: number;
  filesCount: number;
}) {
  const taskStatus = toTaskStatus(status);
  const taskPriority = toTaskPriority(priority);

  return [
    {
      label: "الحالة",
      value: taskStatus ? TASK_STATUS_LABELS[taskStatus] : status,
      hint: "وضع التنفيذ الحالي",
      icon: SquareCheckBig,
    },
    {
      label: "الأولوية",
      value: taskPriority ? TASK_PRIORITY_LABELS[taskPriority] : priority,
      hint: "درجة الأهمية",
      icon: Clock3,
    },
    {
      label: "التعليقات والملفات",
      value: `${formatNumber(commentsCount)} / ${formatNumber(filesCount)}`,
      hint: "تعليقات / ملفات",
      icon: MessageSquare,
    },
    {
      label: "الاستحقاق",
      value: dueDateLabel,
      hint: `${formatNumber(revisionCount)} تعديلات`,
      icon: Calendar,
    },
  ] satisfies TaskStatItem[];
}

export function TaskInfoGrid({
  title,
  description,
  fields,
}: {
  title: string;
  description: string;
  fields: TaskInfoFieldItem[];
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{field.label}</p>
            <p className="mt-2 text-sm font-medium whitespace-pre-wrap">
              {field.value || "—"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TaskTabsCard({
  defaultValue,
  tabs,
}: {
  defaultValue: string;
  tabs: TaskTabItem[];
}) {
  return (
    <Tabs defaultValue={defaultValue} dir="rtl" className="w-full">
      <Card>
        <CardHeader className="gap-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:flex md:flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <tab.icon />
                {tab.label}
                {tab.badge ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {tab.badge}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardHeader>
        <CardContent>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}
        </CardContent>
      </Card>
    </Tabs>
  );
}

export function TaskHistoryTable({
  history,
}: {
  history: TaskHistoryRecord[];
}) {
  if (history.length === 0) {
    return (
      <EmptyPanel
        title="لا يوجد سجل حالة"
        description="ستظهر انتقالات الحالة هنا عند حدوثها."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>من</TableHead>
            <TableHead>إلى</TableHead>
            <TableHead>بواسطة</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.fromStatus || "—"}</TableCell>
              <TableCell>
                <Badge variant={taskStatusVariant(entry.toStatus)}>
                  {toTaskStatus(entry.toStatus)
                    ? TASK_STATUS_LABELS[toTaskStatus(entry.toStatus)!]
                    : entry.toStatus}
                </Badge>
              </TableCell>
              <TableCell>{entry.changerName || "—"}</TableCell>
              <TableCell>{formatDateTime(entry.changedAt) || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TaskCommentsTable({
  comments,
  compact = false,
}: {
  comments: TaskCommentRecord[];
  compact?: boolean;
}) {
  if (comments.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد تعليقات"
        description="سيظهر الحوار المرتبط بهذه المهمة هنا."
      />
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">
                {comment.userName || "مستخدم"}
              </span>
              <span className="text-muted-foreground">
                {formatRelativeTime(comment.createdAt) || "—"}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {comment.content}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التعليق</TableHead>
            <TableHead>بواسطة</TableHead>
            <TableHead>التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment) => (
            <TableRow key={comment.id}>
              <TableCell className="whitespace-pre-wrap">
                {comment.content}
              </TableCell>
              <TableCell>{comment.userName || "—"}</TableCell>
              <TableCell>{formatDateTime(comment.createdAt) || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TaskFilesTable({
  files,
  compact = false,
}: {
  files: TaskFileRecord[];
  compact?: boolean;
}) {
  if (files.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد ملفات"
        description="ستظهر ملفات المهمة هنا بعد رفعها."
      />
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-start gap-3 rounded-lg border p-4"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Paperclip className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.fileName}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {typeof file.fileSize === "number" ? (
                  <span>{formatFileSize(file.fileSize)}</span>
                ) : null}
                {file.purposeLabel ? <span>{file.purposeLabel}</span> : null}
                {file.uploadedAt ? (
                  <span>{formatDateTime(file.uploadedAt)}</span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الملف</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead>الحجم</TableHead>
            <TableHead>الرفع</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.fileName}</TableCell>
              <TableCell>{file.purposeLabel || file.fileType || "—"}</TableCell>
              <TableCell>
                {typeof file.fileSize === "number"
                  ? formatFileSize(file.fileSize)
                  : "—"}
              </TableCell>
              <TableCell>{formatDateTime(file.uploadedAt) || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function buildTaskOperationalFields(task: TaskDetailEntity) {
  return [
    { label: "المشروع", value: task.project?.name || "—" },
    { label: "القسم", value: task.departmentName || "—" },
    { label: "المكلّف", value: task.assigneeName || "—" },
    { label: "المنشئ", value: task.creatorName || "—" },
    { label: "تاريخ البداية", value: formatDateTime(task.startedAt) || "—" },
    { label: "تاريخ التسليم", value: formatDateTime(task.dueDate) || "—" },
    { label: "تاريخ الإنشاء", value: formatDateTime(task.createdAt) || "—" },
    { label: "آخر تحديث", value: formatDateTime(task.updatedAt) || "—" },
  ] satisfies TaskInfoFieldItem[];
}

export function buildTaskLifecycleFields(task: TaskDetailEntity) {
  return [
    { label: "الوصف", value: task.description || "—" },
    {
      label: "موثقة للعميل",
      value:
        typeof task.isVisibleToClient === "boolean"
          ? task.isVisibleToClient
            ? "نعم"
            : "لا"
          : "—",
    },
    { label: "أُرسلت", value: formatDateTime(task.submittedAt) || "—" },
    { label: "أُعتمدت", value: formatDateTime(task.approvedAt) || "—" },
    { label: "أرشفت", value: formatDateTime(task.archivedAt) || "—" },
    {
      label: "عدد التعديلات",
      value:
        typeof task.revisionCount === "number"
          ? formatNumber(task.revisionCount)
          : "—",
    },
  ] satisfies TaskInfoFieldItem[];
}

export function TaskInlineMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export const taskTabIcons = {
  overview: FolderKanban,
  comments: MessageSquare,
  files: Paperclip,
  history: Clock3,
  client: User,
  notes: FileText,
};
