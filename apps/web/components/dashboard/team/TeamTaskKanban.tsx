"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TaskStatus, UserRole } from "@hassad/shared";
import type { TaskWithProject } from "@/features/tasks/tasksApi";
import {
  useStartTaskMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useRejectTaskMutation,
} from "@/features/tasks/tasksApi";
import { useAppSelector } from "@/lib/hooks";
import { KanbanBoard } from "@/components/dashboard/kanban";
import { TASK_STATUS_CONFIG } from "@/components/dashboard/kanban/configs/task-status";
import { EmployeeTaskKanbanCardContent } from "@/components/dashboard/kanban/cards/EmployeeTaskKanbanCardContent";

// ─── Allowed status transitions per role ──────────────────────────────────────

const TASK_STATUS_TRANSITIONS: Partial<
  Record<TaskStatus, Partial<Record<string, TaskStatus[]>>>
> = {
  [TaskStatus.TODO]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
  [TaskStatus.IN_PROGRESS]: { EMPLOYEE: [TaskStatus.IN_REVIEW] },
  [TaskStatus.IN_REVIEW]: { PM: [TaskStatus.DONE, TaskStatus.REVISION] },
  [TaskStatus.REVISION]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface EmployeeTaskKanbanProps {
  tasks: TaskWithProject[];
  isLoading: boolean;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function EmployeeTaskKanban({
  tasks,
  isLoading,
  onStatusChange,
}: EmployeeTaskKanbanProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [startTask] = useStartTaskMutation();
  const [submitTask] = useSubmitTaskMutation();
  const [approveTask] = useApproveTaskMutation();
  const [rejectTask] = useRejectTaskMutation();
  const [localTasks, setLocalTasks] = useState<TaskWithProject[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // ── Permission check for dragging ────────────────────────────────────
  const canDragItem = useCallback(
    (task: TaskWithProject) => {
      if (!user) return false;
      if (user.role === UserRole.ADMIN || user.role === UserRole.PM)
        return true;
      return task.assignedTo === user.id;
    },
    [user],
  );

  // ── Drag end handler with optimistic updates ─────────────────────────
  const handleDragEnd = useCallback(
    async (itemId: string, fromStage: string, toStage: string) => {
      if (!user) return;

      const currentStatus = fromStage as TaskStatus;
      const newStatus = toStage as TaskStatus;

      if (newStatus === currentStatus) return;

      // Permission check
      if (user.role !== UserRole.ADMIN) {
        const roleKey = user.role;
        const allowed = TASK_STATUS_TRANSITIONS[currentStatus]?.[roleKey] ?? [];
        if (!allowed.includes(newStatus)) {
          if (
            currentStatus === TaskStatus.IN_REVIEW &&
            newStatus === TaskStatus.DONE
          ) {
            toast.error(
              "يجب على مدير المشروع مراجعة المهمة والموافقة عليها قبل إتمامها",
            );
          } else {
            toast.error("لا يمكنك نقل المهمة إلى هذه الحالة");
          }
          return;
        }
      }

      // Optimistic update
      const prevTasks = localTasks;
      const updatedTasks = localTasks.map((t) =>
        t.id === itemId ? { ...t, status: newStatus } : t,
      );
      setLocalTasks(updatedTasks);

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
        } else if (
          currentStatus === TaskStatus.REVISION &&
          newStatus === TaskStatus.IN_PROGRESS
        ) {
          await startTask(itemId).unwrap();
        } else {
          setLocalTasks(prevTasks);
          toast.error("لا يمكنك نقل المهمة إلى هذه الحالة");
          return;
        }
        onStatusChange?.(itemId, newStatus);
      } catch (err: unknown) {
        // Rollback on failure
        setLocalTasks(prevTasks);
        const msg =
          (err as { data?: { message?: string }; error?: string })?.data
            ?.message ??
          (err as { error?: string })?.error ??
          "فشل تحديث الحالة";
        toast.error(msg);
      }
    },
    [
      user,
      localTasks,
      startTask,
      submitTask,
      approveTask,
      rejectTask,
      onStatusChange,
    ],
  );

  // ── Render card ──────────────────────────────────────────────────────
  const renderCard = useCallback(
    (task: TaskWithProject, _options: { isOverlay: boolean }) => (
      <EmployeeTaskKanbanCardContent task={task} canDrag={canDragItem(task)} />
    ),
    [canDragItem],
  );

  return (
    <KanbanBoard
      config={TASK_STATUS_CONFIG}
      items={localTasks}
      getItemStage={(t) => t.status}
      renderCard={renderCard}
      onDragEnd={handleDragEnd}
      isLoading={isLoading}
      canDragItem={canDragItem}
      emptyMessage={
        "لم يتم إسناد أي مهمة إليك بعد. سيتم عرض المهام هنا عند إسنادها."
      }
    />
  );
}
