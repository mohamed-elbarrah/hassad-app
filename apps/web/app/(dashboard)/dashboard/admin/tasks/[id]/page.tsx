"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  FileText,
  FolderKanban,
  MessageSquare,
  Paperclip,
  SquareCheckBig,
} from "lucide-react";
import { useGetAdminTaskByIdQuery } from "@/features/admin/adminTasksApi";
import {
  buildTaskLifecycleFields,
  buildTaskOperationalFields,
  buildTaskStats,
  TaskCommentsTable,
  TaskDetailLoading,
  TaskFilesTable,
  TaskHistoryTable,
  TaskInfoGrid,
  TaskStatsGrid,
  TaskSummaryCard,
  TaskTabsCard,
  type TaskDetailEntity,
  type TaskTabItem,
} from "@/components/task-detail/TaskDetailPattern";
import { useMarketingTaskExtraTabs } from "@/components/task-detail/MarketingTaskExtras";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatDateTime } from "@/lib/format";
import { TaskDepartment } from "@hassad/shared";

function mapTask(task: any): TaskDetailEntity {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? String(task.dueDate) : null,
    startedAt: task.startedAt ? String(task.startedAt) : null,
    submittedAt: task.submittedAt ? String(task.submittedAt) : null,
    approvedAt: task.approvedAt ? String(task.approvedAt) : null,
    archivedAt: task.archivedAt ? String(task.archivedAt) : null,
    createdAt: task.createdAt ? String(task.createdAt) : null,
    updatedAt: task.updatedAt ? String(task.updatedAt) : null,
    revisionCount: task.revisionCount ?? 0,
    isVisibleToClient: task.isVisibleToClient,
    project: task.project
      ? {
          id: task.project.id,
          name: task.project.name,
        }
      : null,
    departmentName: task.department?.name ?? null,
    assigneeName: task.assignee?.name ?? null,
    creatorName: task.creator?.name ?? null,
  };
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: task, isLoading, isError } = useGetAdminTaskByIdQuery(id);
  const marketingTabs = useMarketingTaskExtraTabs({
    taskId: id,
    canManage: false,
  });

  if (isLoading) return <TaskDetailLoading />;

  if (isError || !task) {
    return (
      <div className="flex flex-col gap-6   " dir="rtl">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <SquareCheckBig />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>المهمة غير موجودة</EmptyTitle>
                <EmptyDescription>
                  لم نتمكن من العثور على بيانات هذه المهمة.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/dashboard/admin/tasks">
                    <ArrowLeft data-icon="inline-start" />
                    العودة إلى المهام
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskEntity = mapTask(task);
  const stats = buildTaskStats({
    status: task.status,
    priority: task.priority,
    revisionCount: task.revisionCount ?? 0,
    dueDateLabel: formatDateTime(task.dueDate) || "—",
    commentsCount: task.comments.length,
    filesCount: task.files.length,
  });
  const isMarketingTask = task.department?.name === TaskDepartment.MARKETING;

  const tabs: TaskTabItem[] = [
    {
      value: "overview",
      label: "نظرة عامة",
      icon: FolderKanban,
      content: (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <TaskInfoGrid
            title="البيانات الأساسية"
            description="مرجع التشغيل والمسؤولية الخاصة بالمهمة."
            fields={buildTaskOperationalFields(taskEntity)}
          />
          <TaskInfoGrid
            title="الملاحظات والمراحل"
            description="وضع التنفيذ والمراجعات والاعتمادات."
            fields={buildTaskLifecycleFields(taskEntity)}
          />
        </div>
      ),
    },
    {
      value: "history",
      label: "سجل الحالة",
      icon: Clock3,
      badge: String(task.statusHistory.length),
      content: (
        <TaskHistoryTable
          history={task.statusHistory.map((entry) => ({
            id: entry.id,
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            changedAt: entry.changedAt,
            changerName: entry.changer?.name,
          }))}
        />
      ),
    },
    {
      value: "comments",
      label: "التعليقات",
      icon: MessageSquare,
      badge: String(task.comments.length),
      content: (
        <TaskCommentsTable
          comments={task.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            userName: comment.user?.name,
          }))}
        />
      ),
    },
    {
      value: "files",
      label: "الملفات",
      icon: Paperclip,
      badge: String(task.files.length),
      content: (
        <TaskFilesTable
          files={task.files.map((file) => ({
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            uploadedAt: file.uploadedAt,
          }))}
        />
      ),
    },
    {
      value: "notes",
      label: "لقطات سريعة",
      icon: FileText,
      content: (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">الحالة</span>
                <span className="text-lg font-semibold">{stats[0].value}</span>
                <span className="text-sm text-muted-foreground">
                  {stats[0].hint}
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <SquareCheckBig />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">الأولوية</span>
                <span className="text-lg font-semibold">{stats[1].value}</span>
                <span className="text-sm text-muted-foreground">
                  {stats[1].hint}
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Clock3 />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">الملفات</span>
                <span className="text-lg font-semibold">
                  {task.files.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  ملفات مرتبطة
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Paperclip />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">التعليقات</span>
                <span className="text-lg font-semibold">
                  {task.comments.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  نقاشات موثقة
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MessageSquare />
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  if (isMarketingTask) {
    tabs.splice(1, 0, ...marketingTabs);
  }

  return (
    <div className="flex flex-col gap-6   " dir="rtl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">الرئيسية</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/admin/tasks">المهام</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{task.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <TaskSummaryCard
        task={taskEntity}
        badges={[
          <Badge key="department" variant="outline">
            {task.department.name}
          </Badge>,
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/dashboard/admin/projects/${task.project.id}`}>
              <ArrowLeft data-icon="inline-start" />
              المشروع
            </Link>
          </Button>
        }
      />

      <TaskStatsGrid stats={stats} />

      <TaskTabsCard defaultValue="overview" tabs={tabs} />
    </div>
  );
}
