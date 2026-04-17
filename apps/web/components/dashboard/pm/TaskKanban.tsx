"use client";

import { TaskCard } from "./TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetTasksByProjectQuery } from "@/features/tasks/tasksApi";
import type { Task } from "@hassad/shared";
import { TaskStatus } from "@hassad/shared";

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO, label: "للتنفيذ" },
  { status: TaskStatus.IN_PROGRESS, label: "قيد التنفيذ" },
  { status: TaskStatus.IN_REVIEW, label: "قيد المراجعة" },
  { status: TaskStatus.BLOCKED, label: "محظور" },
  { status: TaskStatus.DONE, label: "منجز" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskWithAssignee extends Task {
  assignee?: { id: string; name: string };
}

interface TaskKanbanProps {
  projectId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const {
    data: tasks,
    isLoading,
    isError,
  } = useGetTasksByProjectQuery(projectId);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="min-w-52 flex-shrink-0">
            <Skeleton className="h-6 w-28 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">حدث خطأ أثناء تحميل المهام.</p>
    );
  }

  const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, TaskWithAssignee[]>>(
    (acc, col) => {
      acc[col.status] = (tasks ?? []).filter(
        (t) => t.status === col.status,
      ) as TaskWithAssignee[];
      return acc;
    },
    {} as Record<TaskStatus, TaskWithAssignee[]>,
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasksByStatus[col.status] ?? [];
        return (
          <div key={col.status} className="min-w-56 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {columnTasks.length === 0 ? (
                <div className="h-16 rounded-lg border border-dashed flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">لا توجد مهام</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
