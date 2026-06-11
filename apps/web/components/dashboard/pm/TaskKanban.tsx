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
import { useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";
import Link from "next/link";
import { Calendar, GripVertical, User } from "lucide-react";
import { Skeleton as DSSkeleton } from "@/components/design-system/Skeleton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useGetTasksByProjectQuery } from "@/features/tasks/tasksApi";
import {
  useStartTaskMutation,
  useSubmitTaskMutation,
  useApproveTaskMutation,
  useRejectTaskMutation,
} from "@/features/tasks/tasksApi";
import type { Task } from "@hassad/shared";
import { TaskStatus } from "@hassad/shared";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  TASK_STATUS_COLOR,
  TASK_STATUS_LABELS,
  TASK_KANBAN_ORDER,
  TASK_PRIORITY_LABELS,
  type TaskWithMeta,
} from "@/lib/utils/task-status";

// ── Props ─────────────────────────────────────────────────────────────────────

interface TaskKanbanProps {
  projectId: string;
}

// ── Task Card Component ─────────────────────────────────────────────────────────

interface TaskKanbanCardProps {
  task: TaskWithMeta;
  isOverlay?: boolean;
}

function TaskKanbanCard({ task, isOverlay = false }: TaskKanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  // Status color for visual indicator
  const statusColor = TASK_STATUS_COLOR[task.status as TaskStatus];

  // Priority badge tone
  const priorityTone =
    task.priority === "URGENT"
      ? "danger"
      : task.priority === "HIGH"
      ? "warning"
      : "neutral";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group bg-white rounded-2xl border border-portal-card-border p-4 cursor-grab active:cursor-grabbing transition-all duration-150",
        "hover:border-secondary-500/20 hover:shadow-sm",
        (isDragging || isOverlay) && "opacity-60 rotate-1 scale-[1.02]",
        isOverlay && "shadow-lg border-natural-100"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header: Title + Drag Handle */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/dashboard/pm/tasks/${task.id}`}
          className="text-sm font-semibold text-natural-100 hover:text-secondary-500 hover:underline line-clamp-2 block flex-1 min-w-0 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <GripVertical className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity text-neutral-300" />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Status indicator bar */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className="h-1.5 flex-1 rounded-full"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: task.status === TaskStatus.DONE ? "100%" : task.status === TaskStatus.IN_PROGRESS ? "50%" : "15%",
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>

      {/* Priority & Status badges */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge
          status={priorityTone}
          label={TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] ?? task.priority}
          className="text-[10px]"
        />
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            color: statusColor,
            backgroundColor: `${statusColor}15`,
          }}
        >
          {TASK_STATUS_LABELS[task.status as TaskStatus]}
        </span>
      </div>

      {/* Meta: Assignee & Due Date */}
      <div className="mt-2 flex flex-col gap-1 text-[11px] text-neutral-400">
        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>{task.assignee.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{formatShortDate(task.dueDate)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Task Column Component ─────────────────────────────────────────────────────

interface TaskKanbanColumnProps {
  status: TaskStatus;
  color: string;
  tasks: TaskWithMeta[];
}

function TaskKanbanColumn({ status, color, tasks }: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  // Light tint colors
  const tintColor = `${color}0D`; // ~5% opacity
  const borderColor = `${color}33`; // 20% opacity
  const headerBorder = `${color}26`; // 15% opacity

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 flex flex-col rounded-xl border transition-all duration-150",
        isOver && "ring-2 ring-offset-2"
      )}
      style={{
        "--status-color": color,
        backgroundColor: tintColor,
        borderColor: borderColor,
      } as React.CSSProperties}
    >
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-b"
        style={{ borderColor: headerBorder }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
          {TASK_STATUS_LABELS[status]}
        </span>
        <span
          className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            color: color,
            backgroundColor: `${color}1A`, // 10% opacity
            border: `1px solid ${color}33`,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col gap-2 p-3 min-h-96">
        {tasks.map((task) => (
          <TaskKanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-neutral-400 text-center">لا توجد مهام</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const { data: tasks, isLoading, isError } = useGetTasksByProjectQuery(projectId);

  const [activeTask, setActiveTask] = useState<TaskWithMeta | null>(null);
  const [startTask] = useStartTaskMutation();
  const [submitTask] = useSubmitTaskMutation();
  const [approveTask] = useApproveTaskMutation();
  const [rejectTask] = useRejectTaskMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const typedTasks = (tasks ?? []) as TaskWithMeta[];

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, TaskWithMeta[]>();
    Object.values(TaskStatus).forEach((status) => map.set(status, []));
    typedTasks.forEach((task) => {
      const s = task.status as TaskStatus;
      map.set(s, [...(map.get(s) ?? []), task]);
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

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-2" dir="rtl">
        {TASK_KANBAN_ORDER.map((s) => (
          <div
            key={s}
            className="w-72 shrink-0 rounded-xl border border-neutral-200 animate-pulse"
          >
            <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-200">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="h-4 w-16 bg-neutral-200 rounded" />
              <div className="ml-auto h-5 w-8 bg-neutral-200 rounded-full" />
            </div>
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-lg border border-neutral-200"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (isError) {
    return (
      <EmptyState
        title="حدث خطأ أثناء تحميل المهام"
        description="يرجى تحديث الصفحة والمحاولة مرة أخرى."
      />
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (typedTasks.length === 0) {
    return (
      <EmptyState
        title="لا توجد مهام"
        description="ابدأ بإضافة مهمة جديدة لهذا المشروع."
      />
    );
  }

  // ── Kanban board ─────────────────────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent"
        dir="rtl"
      >
        {TASK_KANBAN_ORDER.map((s) => (
          <TaskKanbanColumn
            key={s}
            status={s}
            color={TASK_STATUS_COLOR[s]}
            tasks={tasksByStatus.get(s) ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskKanbanCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
