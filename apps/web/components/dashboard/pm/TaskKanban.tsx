"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { TaskStatus } from "@hassad/shared";
import {
  useGetPmTasksQuery,
  useChangePmTaskStatusMutation,
} from "@/features/tasks/tasksApi";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { Button } from "@/components/ui/button";
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

function useTaskStagePage(status: TaskStatus, projectId: string, periodId: string | undefined, enabled: boolean) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TaskWithMeta[]>([]);
  const query = useGetPmTasksQuery({ projectId, periodId, status, page, limit: 10 }, { skip: !enabled });

  useEffect(() => { setPage(1); setItems([]); }, [status, projectId, periodId]);
  useEffect(() => {
    if (!enabled || !query.data || query.data.meta.page !== page) return;
    setItems((current) => {
      const seen = new Set(current.map((item) => item.id));
      return [...current, ...query.data.items.filter((item) => !seen.has(item.id))] as TaskWithMeta[];
    });
  }, [enabled, page, query.data]);

  return {
    items, isLoading: query.isLoading, isFetching: query.isFetching, isError: query.isError,
    hasMore: page < (query.data?.meta.totalPages ?? 1),
    onLoadMore: () => { if (!query.isFetching && page < (query.data?.meta.totalPages ?? 1)) setPage((current) => current + 1); },
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TaskKanban({ projectId, periodId, view = "kanban" }: TaskKanbanProps) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [projectId, periodId]);
  const tableQuery = useGetPmTasksQuery({ projectId, periodId, page, limit: 24 }, { skip: view !== "table" });
  const stageQueries = [
    useTaskStagePage(TaskStatus.TODO, projectId, periodId, view === "kanban"),
    useTaskStagePage(TaskStatus.IN_PROGRESS, projectId, periodId, view === "kanban"),
    useTaskStagePage(TaskStatus.IN_REVIEW, projectId, periodId, view === "kanban"),
    useTaskStagePage(TaskStatus.REVISION, projectId, periodId, view === "kanban"),
    useTaskStagePage(TaskStatus.DONE, projectId, periodId, view === "kanban"),
  ];
  const tasks = tableQuery.data;
  const isLoading = view === "table" ? tableQuery.isLoading : stageQueries.some((query) => query.isLoading);
  const isError = view === "table" ? tableQuery.isError : stageQueries.some((query) => query.isError);
  const typedTasks = view === "table" ? ((tasks?.items ?? []) as TaskWithMeta[]) : stageQueries.flatMap((query) => query.items);
  const stagePagination = Object.fromEntries(
    TASK_STATUS_CONFIG.stageOrder.map((stage, index) => [stage, {
      hasMore: stageQueries[index].hasMore,
      isLoading: stageQueries[index].isFetching,
      onLoadMore: stageQueries[index].onLoadMore,
    }]),
  );
  const [changeTaskStatus] = useChangePmTaskStatusMutation();

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
          toast.error(pmErrorMessage({ data: { error: { code: "TASK_INVALID_TRANSITION" } } }));
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
      <div className="flex flex-col gap-4">
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
      {(tasks?.meta.totalPages ?? 1) > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>السابق</Button>
          <span className="text-sm text-muted-foreground">صفحة {page} من {tasks?.meta.totalPages}</span>
          <Button variant="outline" disabled={page >= (tasks?.meta.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>التالي</Button>
        </div>
      ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
      stagePagination={stagePagination}
      />
    </div>
  );
}
