"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { KanbanGroup } from "@/components/dashboard/crm/KanbanGroup";
import { useGetTasksByProjectQuery } from "@/features/tasks/tasksApi";
import {
  useStartTaskMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useRejectTaskMutation,
} from "@/features/tasks/tasksApi";
import type { Task } from "@hassad/shared";
import { TaskStatus } from "@hassad/shared";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { Calendar, GripVertical, User } from "lucide-react";

interface TaskWithAssignee extends Task {
  assignee?: { id: string; name: string };
}

interface TaskKanbanProps {
  projectId: string;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "للتنفيذ",
  [TaskStatus.IN_PROGRESS]: "قيد التنفيذ",
  [TaskStatus.IN_REVIEW]: "قيد المراجعة",
  [TaskStatus.REVISION]: "يحتاج تعديل",
  [TaskStatus.DONE]: "منجز",
};

const STATUS_MAP: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "PENDING",
  [TaskStatus.IN_PROGRESS]: "IN_PROGRESS",
  [TaskStatus.IN_REVIEW]: "PENDING",
  [TaskStatus.REVISION]: "REJECTED",
  [TaskStatus.DONE]: "COMPLETED",
};

const STATUS_COLORS: Record<TaskStatus, { column: string; dot: string }> = {
  [TaskStatus.TODO]: {
    column: "bg-neutral-50 border-neutral-200",
    dot: "bg-neutral-400",
  },
  [TaskStatus.IN_PROGRESS]: {
    column: "bg-action-blue-soft border-action-blue",
    dot: "bg-action-blue",
  },
  [TaskStatus.IN_REVIEW]: {
    column: "bg-alert-100/50 border-alert-200",
    dot: "bg-alert-500",
  },
  [TaskStatus.REVISION]: {
    column: "bg-danger-100/50 border-danger-200",
    dot: "bg-danger-500",
  },
  [TaskStatus.DONE]: {
    column: "bg-success-100/50 border-success-200",
    dot: "bg-success-500",
  },
};

const TASK_GROUPS = [
  {
    id: "backlog",
    label: "التحضير",
    accentClass: "bg-neutral-50 border-neutral-200 text-neutral-700",
    textClass: "text-neutral-700",
    statuses: [TaskStatus.TODO],
  },
  {
    id: "execution",
    label: "التنفيذ",
    accentClass: "bg-action-blue-soft border-action-blue text-action-blue",
    textClass: "text-action-blue",
    statuses: [TaskStatus.IN_PROGRESS, TaskStatus.REVISION],
  },
  {
    id: "review_done",
    label: "المراجعة والإغلاق",
    accentClass: "bg-success-100/50 border-success-200 text-success-600",
    textClass: "text-success-600",
    statuses: [TaskStatus.IN_REVIEW, TaskStatus.DONE],
  },
] as const;

interface TaskKanbanColumnProps {
  status: TaskStatus;
  tasks: TaskWithAssignee[];
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "منخفض",
  NORMAL: "عادي",
  HIGH: "عالي",
  URGENT: "عاجل",
};

const PRIORITY_MAP: Record<string, string> = {
  LOW: "neutral",
  NORMAL: "neutral",
  HIGH: "warning",
  URGENT: "danger",
};

interface DraggableTaskCardProps {
  task: TaskWithAssignee;
  isOverlay?: boolean;
}

function DraggableTaskCard({
  task,
  isOverlay = false,
}: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-natural-0 rounded-lg border p-3 cursor-grab active:cursor-grabbing",
        "hover:border-secondary-500/40 hover:shadow-sm transition-all duration-100",
        (isDragging || isOverlay) && "opacity-50 shadow-xl rotate-1 scale-105",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/pm/tasks/${task.id}`}
          className="text-sm font-medium hover:underline line-clamp-2 block flex-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <GripVertical className="h-4 w-4 text-neutral-300/40 shrink-0 mt-0.5" />
      </div>

      {task.description && (
        <p className="text-xs text-neutral-300 mt-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge
          status={PRIORITY_MAP[task.priority as string] ?? "neutral"}
          label={PRIORITY_LABELS[task.priority as string] ?? task.priority}
          className="text-[10px]"
        />
        <span className="text-[11px] text-neutral-300">
          {STATUS_LABELS[task.status as TaskStatus]}
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-[11px] text-neutral-300">
        {task.assignee && (
          <div className="flex items-center gap-1">
            <User className="size-3 shrink-0" />
            <span>{task.assignee.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          <span>
            {new Intl.DateTimeFormat("en-GB", {
              month: "short",
              day: "numeric",
              numberingSystem: "latn",
            }).format(new Date(task.dueDate))}
          </span>
        </div>
      </div>
    </div>
  );
}

function TaskKanbanColumn({ status, tasks }: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const color = STATUS_COLORS[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 rounded-xl border-2 flex flex-col transition-all duration-150",
        color.column,
        isOver && "ring-2 ring-secondary-500 ring-offset-2 scale-[1.01]",
      )}
    >
      <div className="px-3 py-2.5 border-b border-inherit">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", color.dot)} />
            <h3 className="text-xs font-semibold text-natural-100 truncate">
              {STATUS_LABELS[status]}
            </h3>
          </div>
          <span className="text-xs font-medium bg-natural-0/70 px-2 py-0.5 rounded-full text-neutral-300 shrink-0 tabular-nums">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2 min-h-28 flex-1">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-20">
            <p className="text-xs text-neutral-300/60 text-center select-none">
              لا توجد مهام
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const { data: tasks, isLoading, isError } = useGetTasksByProjectQuery(projectId);

  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);
  const [startTask] = useStartTaskMutation();
  const [submitTask] = useSubmitTaskMutation();
  const [approveTask] = useApproveTaskMutation();
  const [rejectTask] = useRejectTaskMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const typedTasks = (tasks ?? []) as TaskWithAssignee[];

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, TaskWithAssignee[]>();
    Object.values(TaskStatus).forEach((status) => map.set(status, []));
    typedTasks.forEach((task) => {
      const status = task.status as TaskStatus;
      map.set(status, [...(map.get(status) ?? []), task]);
    });
    return map;
  }, [typedTasks]);

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.id as string;
    const task = typedTasks.find((item) => item.id === taskId) ?? null;
    setActiveTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const currentStatus = active.data.current?.status as TaskStatus;

    if (newStatus === currentStatus) return;

    try {
      if (
        (currentStatus === TaskStatus.TODO || currentStatus === TaskStatus.REVISION) &&
        newStatus === TaskStatus.IN_PROGRESS
      ) {
        await startTask(taskId).unwrap();
      } else if (
        currentStatus === TaskStatus.IN_PROGRESS &&
        newStatus === TaskStatus.IN_REVIEW
      ) {
        await submitTask(taskId).unwrap();
      } else if (
        currentStatus === TaskStatus.IN_REVIEW &&
        newStatus === TaskStatus.DONE
      ) {
        await approveTask(taskId).unwrap();
      } else if (
        currentStatus === TaskStatus.IN_REVIEW &&
        newStatus === TaskStatus.REVISION
      ) {
        await rejectTask(taskId).unwrap();
      } else {
        toast.error("الانتقال غير مسموح في مسار حالة المهام");
      }
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تحديث حالة المهمة";
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {TASK_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2">
            <div className="h-10 bg-neutral-50/80 animate-pulse rounded-lg" />
            <div className="flex gap-3">
              {group.statuses.map((status) => (
                <div
                  key={status}
                  className="w-72 shrink-0 h-44 bg-neutral-50/80 animate-pulse rounded-xl"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-danger-500 text-sm">حدث خطأ أثناء تحميل المهام.</p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5" dir="rtl">
        {TASK_GROUPS.map((group) => {
          const groupCount = group.statuses.reduce(
            (sum, status) => sum + (tasksByStatus.get(status)?.length ?? 0),
            0,
          );

          return (
            <KanbanGroup
              key={group.id}
              id={group.id}
              label={group.label}
              accentClass={group.accentClass}
              textClass={group.textClass}
              totalCount={groupCount}
            >
              {group.statuses.map((status) => (
                <TaskKanbanColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus.get(status) ?? []}
                />
              ))}
            </KanbanGroup>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <DraggableTaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
