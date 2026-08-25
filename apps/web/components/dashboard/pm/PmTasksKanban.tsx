"use client";

import { toast } from "sonner";
import { TaskStatus } from "@hassad/shared";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { TASK_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/task-status";
import { TaskKanbanCardContent } from "@/components/dashboard/kanban/cards/TaskKanbanCardContent";
import {
  useChangePmTaskStatusMutation,
  type TaskWithProject,
} from "@/features/tasks/tasksApi";
import type { TaskWithMeta } from "@/lib/utils/task-status";
import { pmErrorMessage } from "@/lib/i18n";

interface PmTasksKanbanProps {
  tasks: TaskWithProject[];
  isLoading: boolean;
  isError: boolean;
}

export function PmTasksKanban({
  tasks,
  isLoading,
  isError,
}: PmTasksKanbanProps) {
  const [changeTaskStatus] = useChangePmTaskStatusMutation();
  const kanbanTasks: TaskWithMeta[] = tasks;

  async function handleDragEnd(
    taskId: string,
    _currentStatus: string,
    nextStatus: string,
  ) {
    try {
      await changeTaskStatus({
        id: taskId,
        status: nextStatus as TaskStatus,
      }).unwrap();
    } catch (error) {
      toast.error(pmErrorMessage(error));
    }
  }

  function canDropItem(task: TaskWithMeta, nextStatus: string) {
    const currentStatus = task.status as TaskStatus;
    return (
      (currentStatus === TaskStatus.TODO ||
        currentStatus === TaskStatus.REVISION) &&
        nextStatus === TaskStatus.IN_PROGRESS ||
      currentStatus === TaskStatus.IN_PROGRESS &&
        nextStatus === TaskStatus.IN_REVIEW ||
      currentStatus === TaskStatus.IN_REVIEW &&
        (nextStatus === TaskStatus.DONE || nextStatus === TaskStatus.REVISION)
    );
  }

  return (
    <KanbanBoard
      config={TASK_STATUS_CONFIG}
      items={kanbanTasks}
      getItemStage={(task) => task.status}
      renderCard={(task) => (
        <TaskKanbanCardContent
          task={task}
          detailPath="/dashboard/pm/tasks"
        />
      )}
      onDragEnd={handleDragEnd}
      canDropItem={canDropItem}
      onInvalidDrop={() =>
        toast.error(
          pmErrorMessage({ data: { error: { code: "TASK_DROP_NOT_ALLOWED" } } }),
        )
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="تعذر تحميل المهام"
      emptyMessage="لا توجد مهام مطابقة للفلتر المحدد."
    />
  );
}
