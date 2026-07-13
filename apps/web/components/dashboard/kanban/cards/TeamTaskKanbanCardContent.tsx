"use client";

import Link from "next/link";
import { GripVertical, Lock } from "lucide-react";
import { Pill } from "@/components/design-system/Pill";
import { TaskPriority, TaskStatus } from "@hassad/shared";
import { TASK_PRIORITY_LABELS } from "@/lib/utils/task-status";
import type { TaskWithProject } from "@/features/tasks/tasksApi";

// ─── Priority tone map ───────────────────────────────────────────────────────

const PRIORITY_TONE: Record<
  TaskPriority,
  "neutral" | "success" | "warning" | "danger" | "blue"
> = {
  [TaskPriority.LOW]: "neutral",
  [TaskPriority.NORMAL]: "neutral",
  [TaskPriority.HIGH]: "blue",
  [TaskPriority.URGENT]: "danger",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeamTaskKanbanCardContentProps {
  task: TaskWithProject;
  canDrag?: boolean;
}

/**
 * Card content for the team task kanban.
 *
 * Renders task title, project name, priority pill, and due date.
 * Shows a lock icon when the card is not draggable.
 */
export function TeamTaskKanbanCardContent({
  task,
  canDrag = true,
}: TeamTaskKanbanCardContentProps) {
  const isOverdue =
    task.dueDate != null &&
    task.status !== TaskStatus.DONE &&
    new Date(task.dueDate) < new Date();

  const dueDateFormatted = task.dueDate
    ? new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
        day: "numeric",
        month: "short",
      }).format(new Date(task.dueDate))
    : null;

  return (
    <>
      {/* ── Header: Drag Handle + Title + Project ──────────────────── */}
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 shrink-0 ${
            canDrag ? "" : "cursor-not-allowed opacity-60"
          }`}
          style={{ color: "#A8ABB2" }}
        >
          {canDrag ? (
            <GripVertical className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/team/tasks/${task.id}`}
            className="text-sm font-medium hover:underline line-clamp-2 block"
            style={{ color: "#000000" }}
            onClick={(e) => e.stopPropagation()}
          >
            {task.title}
          </Link>
          {task.project && (
            <p
              className="text-xs mt-0.5 line-clamp-1"
              style={{ color: "#A8ABB2" }}
            >
              {task.project.name}
            </p>
          )}
        </div>
      </div>

      {/* ── Priority + Due Date ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1 flex-wrap mt-2">
        <Pill tone={PRIORITY_TONE[task.priority]} className="text-xs">
          {TASK_PRIORITY_LABELS[task.priority]}
        </Pill>
        {dueDateFormatted && (
          <span
            className={`text-xs ${
              isOverdue ? "text-danger-500 font-medium" : ""
            }`}
            style={{ color: isOverdue ? undefined : "#A8ABB2" }}
          >
            {dueDateFormatted}
          </span>
        )}
      </div>
    </>
  );
}
