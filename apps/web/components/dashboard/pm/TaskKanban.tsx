"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { TaskStatus } from "@hassad/shared";
import {
  useGetTasksByProjectQuery,
  useStartTaskMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useRejectTaskMutation,
} from "@/features/tasks/tasksApi";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { TASK_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/task-status";
import { TaskKanbanCardContent } from "@/components/dashboard/kanban/cards/TaskKanbanCardContent";
import type { TaskWithMeta } from "@/lib/utils/task-status";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TaskKanbanProps {
  projectId: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const { data: tasks, isLoading, isError } = useGetTasksByProjectQuery(projectId);
  const [startTask] = useStartTaskMutation();
  const [submitTask] = useSubmitTaskMutation();
  const [approveTask] = useApproveTaskMutation();
  const [rejectTask] = useRejectTaskMutation();

  const typedTasks = (tasks ?? []) as TaskWithMeta[];

  // ── Drag end handler (state machine) ─────────────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, fromStage: string, toStage: string) => {
      const currentStatus = fromStage as TaskStatus;
      const newStatus = toStage as TaskStatus;

      if (newStatus === currentStatus) return;

      try {
        if (
          (currentStatus === TaskStatus.TODO ||
            currentStatus === TaskStatus.REVISION) &&
          newStatus === TaskStatus.IN_PROGRESS
        ) {
          await startTask(itemId).unwrap();
        } else if (
          currentStatus === TaskStatus.IN_PROGRESS &&
          newStatus === TaskStatus.IN_REVIEW
        ) {
          await submitTask(itemId).unwrap();
        } else if (
          currentStatus === TaskStatus.IN_REVIEW &&
          newStatus === TaskStatus.DONE
        ) {
          await approveTask(itemId).unwrap();
        } else if (
          currentStatus === TaskStatus.IN_REVIEW &&
          newStatus === TaskStatus.REVISION
        ) {
          await rejectTask(itemId).unwrap();
        } else {
          toast.error("الانتقال غير مسموح في مسار حالة المهام");
        }
      } catch (err: unknown) {
        const message =
          (err as { data?: { message?: string } })?.data?.message ??
          "فشل تحديث حالة المهمة";
        toast.error(message);
      }
    },
    [startTask, submitTask, approveTask, rejectTask],
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
