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
import {
  getTaskKanbanStage,
  getTaskStatusForKanbanStage,
  type TaskWithMeta,
} from "@/lib/utils/task-status";
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
        status: getTaskStatusForKanbanStage(nextStatus),
      }).unwrap();
    } catch (error) {
      toast.error(pmErrorMessage(error));
    }
  }

  function canDropItem(task: TaskWithMeta, nextStatus: string) {
    const currentStatus = getTaskStatusForKanbanStage(getTaskKanbanStage(task));
    if (currentStatus === TaskStatus.CLIENT_REVIEW) return false;
    const destinationStatus = getTaskStatusForKanbanStage(nextStatus);
    return (
      ((currentStatus === TaskStatus.TODO ||
        currentStatus === TaskStatus.REVISION) &&
        destinationStatus === TaskStatus.IN_PROGRESS) ||
      (currentStatus === TaskStatus.IN_PROGRESS &&
        destinationStatus === TaskStatus.IN_REVIEW) ||
      (currentStatus === TaskStatus.IN_REVIEW &&
        (destinationStatus === TaskStatus.DONE ||
          destinationStatus === TaskStatus.REVISION))
    );
  }

  return (
    <KanbanBoard<TaskWithMeta>
      config={TASK_STATUS_CONFIG}
      items={kanbanTasks}
      getItemStage={getTaskKanbanStage}
      renderCard={(task) => (
        <TaskKanbanCardContent task={task} detailPath="/dashboard/pm/tasks" />
      )}
      onDragEnd={handleDragEnd}
      canDropItem={canDropItem}
      canDragItem={(task) =>
        getTaskStatusForKanbanStage(getTaskKanbanStage(task)) !==
        TaskStatus.CLIENT_REVIEW
      }
      onInvalidDrop={() =>
        toast.error(
          pmErrorMessage({
            data: { error: { code: "TASK_DROP_NOT_ALLOWED" } },
          }),
        )
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="تعذر تحميل المهام"
      emptyMessage="لا توجد مهام مطابقة للفلتر المحدد."
    />
  );
}
