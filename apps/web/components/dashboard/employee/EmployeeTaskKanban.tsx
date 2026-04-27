"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  TaskStatus,
  TaskPriority,
  UserRole,
} from "@hassad/shared";
import type { TaskWithProject } from "@/features/tasks/tasksApi";
import { useUpdateTaskStatusMutation } from "@/features/tasks/tasksApi";
import { useAppSelector } from "@/lib/hooks";

// Allowed status transitions per role (mirrors API workflow)
const TASK_STATUS_TRANSITIONS: Partial<Record<TaskStatus, Partial<Record<string, TaskStatus[]>>>> = {
  [TaskStatus.TODO]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
  [TaskStatus.IN_PROGRESS]: { EMPLOYEE: [TaskStatus.IN_REVIEW] },
  [TaskStatus.IN_REVIEW]: { PM: [TaskStatus.DONE, TaskStatus.REVISION] },
  [TaskStatus.REVISION]: { EMPLOYEE: [TaskStatus.IN_PROGRESS] },
};

// ── Column config ─────────────────────────────────────────────────────────────

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  bg: string;
  headerColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: TaskStatus.TODO,
    label: "للتنفيذ",
    bg: "bg-gray-100",
    headerColor: "text-gray-700",
  },
  {
    status: TaskStatus.IN_PROGRESS,
    label: "قيد التنفيذ",
    bg: "bg-blue-50",
    headerColor: "text-blue-700",
  },
  {
    status: TaskStatus.IN_REVIEW,
    label: "قيد المراجعة",
    bg: "bg-amber-50",
    headerColor: "text-amber-700",
  },
  {
    status: TaskStatus.REVISION,
    label: "يحتاج تعديل",
    bg: "bg-red-50",
    headerColor: "text-red-700",
  },
  {
    status: TaskStatus.DONE,
    label: "منجز",
    bg: "bg-green-50",
    headerColor: "text-green-700",
  },
];

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

const PRIORITY_VARIANT: Record<
  TaskPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [TaskPriority.LOW]: "secondary",
  [TaskPriority.NORMAL]: "outline",
  [TaskPriority.HIGH]: "default",
  [TaskPriority.URGENT]: "destructive",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface EmployeeTaskKanbanProps {
  tasks: TaskWithProject[];
  isLoading: boolean;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

// ── Draggable card ────────────────────────────────────────────────────────────

interface DraggableCardProps {
  task: TaskWithProject;
  overlay?: boolean;
  canDrag?: boolean;
}

function DraggableCard({
  task,
  overlay = false,
  canDrag = true,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { status: task.status },
      disabled: !canDrag,
    });

  const isOverdue =
    task.dueDate != null &&
    task.status !== TaskStatus.DONE &&
    new Date(task.dueDate) < new Date();

  const dueDateFormatted = task.dueDate
    ? new Intl.DateTimeFormat("ar-SA", {
        day: "numeric",
        month: "short",
      }).format(new Date(task.dueDate))
    : null;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging && !overlay ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border p-3 shadow-sm space-y-2 ${
        overlay ? "shadow-lg rotate-1 cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          {...(canDrag ? attributes : {})}
          {...(canDrag ? listeners : {})}
          className={`mt-0.5 text-muted-foreground shrink-0 ${canDrag ? "" : "cursor-not-allowed opacity-60"}`}
          aria-label={canDrag ? "اسحب للتحريك" : "غير مسموح بالتحريك"}
        >
          {canDrag ? (
            <GripVertical className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/employee/tasks/${task.id}`}
            className="text-sm font-medium hover:underline line-clamp-2 block"
            onClick={(e) => e.stopPropagation()}
          >
            {task.title}
          </Link>
          {task.project && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {task.project.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 flex-wrap">
        <Badge variant={PRIORITY_VARIANT[task.priority]} className="text-xs">
          {PRIORITY_LABELS[task.priority]}
        </Badge>
        {dueDateFormatted && (
          <span
            className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
          >
            {dueDateFormatted}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Droppable column ──────────────────────────────────────────────────────────

interface DroppableColumnProps {
  config: ColumnConfig;
  tasks: TaskWithProject[];
  pmOnly?: boolean;
  currentUser?: { id: string; role: UserRole } | null;
}

function DroppableColumn({
  config,
  tasks,
  pmOnly,
  currentUser,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: config.status });

  return (
    <div className="flex flex-col min-w-56 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className={`text-sm font-semibold ${config.headerColor}`}>
            {config.label}
          </h3>
          {pmOnly && (
            <Lock
              className="size-3 text-muted-foreground"
              aria-label="يحتاج موافقة المدير"
            />
          )}
        </div>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`rounded-xl p-2 flex flex-col gap-2 min-h-32 transition-colors ${config.bg} ${
          isOver ? "ring-2 ring-primary ring-offset-1" : ""
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg min-h-20">
            <p className="text-xs text-muted-foreground">اسحب هنا</p>
          </div>
        ) : (
          tasks.map((task) => {
            // Use task.assignedTo (direct string FK) — always present and reliable.
            // task.assignee?.id is the joined relation and may be undefined.
            const canDrag =
              !!currentUser &&
              (currentUser.role === UserRole.ADMIN ||
                currentUser.role === UserRole.PM ||
                task.assignedTo === currentUser.id);
            return (
              <DraggableCard key={task.id} task={task} canDrag={canDrag} />
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmployeeTaskKanban({
  tasks,
  isLoading,
  onStatusChange,
}: EmployeeTaskKanbanProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [activeTask, setActiveTask] = useState<TaskWithProject | null>(null);
  // Local optimistic state so UI updates immediately on drop
  const [localTasks, setLocalTasks] = useState<TaskWithProject[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="min-w-56 shrink-0">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tasksByStatus = COLUMNS.reduce<Record<TaskStatus, TaskWithProject[]>>(
    (acc, col) => {
      acc[col.status] = localTasks.filter((t) => t.status === col.status);
      return acc;
    },
    {} as Record<TaskStatus, TaskWithProject[]>,
  );

  function handleDragStart(event: { active: { id: string | number } }) {
    const task = localTasks.find((t) => t.id === String(event.active.id));
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const { active, over } = event;
    if (!over || !user) return;

    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const task = localTasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // ADMIN bypasses all transition restrictions
    if (user.role !== UserRole.ADMIN) {
      const roleKey = user.role;
      const allowed = TASK_STATUS_TRANSITIONS[task.status]?.[roleKey] ?? [];

      if (!allowed.includes(newStatus)) {
        // Give a specific message when trying to move from IN_REVIEW to DONE
        if (
          task.status === TaskStatus.IN_REVIEW &&
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

    // Optimistic UI update: apply change locally immediately
    const prevTasks = localTasks;
    const updatedTasks = localTasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    );

    setLocalTasks(updatedTasks);

    try {
      await updateTaskStatus({
        id: taskId,
        body: { status: newStatus },
      }).unwrap();
      onStatusChange?.(taskId, newStatus);
    } catch (err: any) {
      // Revert optimistic update on error
      setLocalTasks(prevTasks);
      const msg = err?.data?.message ?? err?.error ?? "فشل تحديث الحالة";
      toast.error(msg);
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.status}
            config={col}
            tasks={tasksByStatus[col.status] ?? []}
            pmOnly={
              col.status === TaskStatus.DONE &&
              user?.role !== UserRole.ADMIN &&
              user?.role !== UserRole.PM
            }
            currentUser={user}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <DraggableCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
