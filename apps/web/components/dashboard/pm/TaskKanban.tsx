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
import { formatShortDate } from "@/lib/format";

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

/* ── Softer status dot colors (design tokens) ─────────────────────────────── */
const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "#A8ABB2",
  [TaskStatus.IN_PROGRESS]: "#2684FC",
  [TaskStatus.IN_REVIEW]: "#F8AF01",
  [TaskStatus.REVISION]: "#FB3748",
  [TaskStatus.DONE]: "#0ED589",
};

const TASK_GROUPS = [
  {
    id: "backlog",
    label: "التحضير",
    statuses: [TaskStatus.TODO],
  },
  {
    id: "execution",
    label: "التنفيذ",
    statuses: [TaskStatus.IN_PROGRESS, TaskStatus.REVISION],
  },
  {
    id: "review_done",
    label: "المراجعة والإغلاق",
    statuses: [TaskStatus.IN_REVIEW, TaskStatus.DONE],
  },
] as const;

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
        "group bg-white rounded-2xl border-[1.5px] border-portal-card-border p-4 cursor-grab active:cursor-grabbing transition-all duration-150",
        "hover:border-secondary-500/20",
        (isDragging || isOverlay) && "opacity-60 rotate-1 scale-[1.02]",
      )}
      style={
        isOverlay
          ? {
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
              borderColor: "#121936",
            }
          : undefined
      }
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/pm/tasks/${task.id}`}
          className="text-sm font-semibold hover:underline line-clamp-2 block flex-1 min-w-0"
          style={{ color: "#000000" }}
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <GripVertical
          className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: "#A8ABB2" }}
        />
      </div>

      {task.description && (
        <p
          className="text-xs mt-2 line-clamp-2 leading-relaxed"
          style={{ color: "rgba(0, 0, 0, 0.5)" }}
        >
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge
          status={PRIORITY_MAP[task.priority as string] ?? "neutral"}
          label={PRIORITY_LABELS[task.priority as string] ?? task.priority}
          className="text-[10px]"
        />
        <span
          className="text-[11px] font-medium"
          style={{ color: "#A8ABB2" }}
        >
          {STATUS_LABELS[task.status as TaskStatus]}
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-[11px]">
        {task.assignee && (
          <div className="flex items-center gap-1">
            <User
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "#A8ABB2" }}
            />
            <span style={{ color: "#A8ABB2" }}>{task.assignee.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "#A8ABB2" }}
          />
          <span style={{ color: "#A8ABB2" }}>
            {formatShortDate(task.dueDate)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface TaskKanbanColumnProps {
  status: TaskStatus;
  tasks: TaskWithAssignee[];
}

function TaskKanbanColumn({ status, tasks }: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 rounded-xl flex flex-col transition-all duration-150",
        isOver && "ring-2 ring-secondary-500/30 ring-offset-2 scale-[1.01]",
      )}
    >
      <div className="flex items-center gap-2 justify-between px-1 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_DOT_COLORS[status] }}
          />
          <h3
            className="text-xs font-semibold truncate"
            style={{ color: "#000000" }}
          >
            {STATUS_LABELS[status]}
          </h3>
        </div>
        <span
          className="text-xs font-medium rounded-full shrink-0 tabular-nums"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            color: "#A8ABB2",
            padding: "2px 8px",
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 min-h-20 flex-1">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center flex-1 min-h-16">
            <p
              className="text-xs text-center select-none"
              style={{ color: "#A8ABB2" }}
            >
              لا توجد مهام
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const {
    data: tasks,
    isLoading,
    isError,
  } = useGetTasksByProjectQuery(projectId);

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
        (currentStatus === TaskStatus.TODO ||
          currentStatus === TaskStatus.REVISION) &&
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
            <div className="h-10 bg-portal-bg animate-pulse rounded-xl border border-portal-card-border" />
            <div className="flex gap-3">
              {group.statuses.map((status) => (
                <div
                  key={status}
                  className="w-72 shrink-0 h-44 bg-white animate-pulse rounded-2xl border border-portal-card-border"
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
              totalCount={groupCount}
            >
              <div className="flex gap-3 overflow-x-auto pb-2">
                {group.statuses.map((status) => (
                  <TaskKanbanColumn
                    key={status}
                    status={status}
                    tasks={tasksByStatus.get(status) ?? []}
                  />
                ))}
              </div>
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
