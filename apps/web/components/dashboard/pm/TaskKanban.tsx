"use client";

import { useCallback } from "react";
import { toast } from "sonner";
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

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TaskKanbanProps {
  projectId: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const {
    data: tasks,
    isLoading,
    isError,
  } = useGetPmTasksQuery({ projectId, limit: 100 });
  const [changeTaskStatus] = useChangePmTaskStatusMutation();

  const typedTasks = (tasks ?? []) as TaskWithMeta[];

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
