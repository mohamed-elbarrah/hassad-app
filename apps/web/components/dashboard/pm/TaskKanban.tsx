"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { TaskStatus } from "@hassad/shared";
import {
  useGetPmTasksQuery,
  useChangePmTaskStatusMutation,
} from "@/features/tasks/tasksApi";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { TASK_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/task-status";
import { TaskKanbanCardContent } from "@/components/dashboard/kanban/cards/TaskKanbanCardContent";
import type { TaskWithMeta } from "@/lib/utils/task-status";
import { pmErrorMessage } from "@/lib/i18n";
import { formatShortDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/utils/task-status";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TaskKanbanProps {
  projectId: string;
  periodId?: string;
  view?: "kanban" | "table";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TaskKanban({ projectId, periodId, view = "kanban" }: TaskKanbanProps) {
  const {
    data: tasks,
    isLoading,
    isError,
  } = useGetPmTasksQuery({ projectId, periodId, limit: 100 });
  const [changeTaskStatus] = useChangePmTaskStatusMutation();

  const typedTasks = (tasks?.items ?? []) as TaskWithMeta[];

  // ── Drag end handler (state machine) ─────────────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, fromStage: string, toStage: string) => {
      const currentStatus = fromStage as TaskStatus;
      const newStatus = toStage as TaskStatus;

      if (newStatus === currentStatus) return;

      try {
        const validTransition =
          ((currentStatus === TaskStatus.TODO ||
            currentStatus === TaskStatus.REVISION) &&
            newStatus === TaskStatus.IN_PROGRESS) ||
          (currentStatus === TaskStatus.IN_PROGRESS &&
            newStatus === TaskStatus.IN_REVIEW) ||
          (currentStatus === TaskStatus.IN_REVIEW &&
            (newStatus === TaskStatus.DONE ||
              newStatus === TaskStatus.REVISION));

        if (!validTransition) {
          toast.error("الانتقال غير مسموح في مسار حالة المهام");
          return;
        }

        await changeTaskStatus({ id: itemId, status: newStatus }).unwrap();
      } catch (err: unknown) {
        toast.error(pmErrorMessage(err));
      }
    },
    [changeTaskStatus],
  );

  // ── Render card ──────────────────────────────────────────────────────
  const renderCard = useCallback(
    (task: TaskWithMeta, _options: { isOverlay: boolean }) => (
      <TaskKanbanCardContent task={task} detailPath="/dashboard/pm/tasks" />
    ),
    [],
  );

  if (view === "table") {
    if (isLoading) return <Skeleton className="h-48 w-full" />;
    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertDescription>حدث خطأ أثناء تحميل المهام</AlertDescription>
        </Alert>
      );
    }
    if (typedTasks.length === 0) {
      return (
        <Empty className="border">
          <EmptyTitle>لا توجد مهام</EmptyTitle>
          <EmptyDescription>ابدأ بإضافة مهمة جديدة لهذه الفترة.</EmptyDescription>
        </Empty>
      );
    }

    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableCaption>قائمة مهام الفترة</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>المهمة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>المسند إليه</TableHead>
              <TableHead>تاريخ الاستحقاق</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Link href={`/dashboard/pm/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell><Badge variant="outline">{TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ?? task.priority}</Badge></TableCell>
                <TableCell>
                  {task.assignee ? <span className="inline-flex items-center gap-1.5"><User className="size-4" aria-hidden="true" />{task.assignee.name}</span> : "—"}
                </TableCell>
                <TableCell><span className="inline-flex items-center gap-1.5"><Calendar className="size-4" aria-hidden="true" />{formatShortDate(task.dueDate)}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <KanbanBoard
      config={TASK_STATUS_CONFIG}
      items={typedTasks}
      getItemStage={(t) => t.status}
      renderCard={renderCard}
      onDragEnd={handleDragEnd}
      isLoading={isLoading}
      isError={isError}
      errorMessage="حدث خطأ أثناء تحميل المهام"
      emptyMessage="لا توجد مهام — ابدأ بإضافة مهمة جديدة لهذا المشروع"
    />
  );
}
