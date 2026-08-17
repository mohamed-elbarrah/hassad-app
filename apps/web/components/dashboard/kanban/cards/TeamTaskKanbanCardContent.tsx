"use client";

import Link from "next/link";
import { GripVertical, Lock } from "lucide-react";
import { TaskStatus } from "@hassad/shared";
import { TASK_PRIORITY_LABELS } from "@/lib/utils/task-status";
import type { TaskWithProject } from "@/features/tasks/tasksApi";
import { Badge } from "@/components/ui/badge";

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
          } text-muted-foreground`}
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
            className="block line-clamp-2 text-sm font-medium text-foreground hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {task.title}
          </Link>
          {task.project && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {task.project.name}
            </p>
          )}
        </div>
      </div>

      {/* ── Priority + Due Date ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1 flex-wrap mt-2">
        <Badge variant="secondary" className="text-xs">
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
        {dueDateFormatted && (
          <span
            className={`text-xs ${
              isOverdue ? "font-medium text-destructive" : "text-muted-foreground"
            }`}
          >
            {dueDateFormatted}
          </span>
        )}
      </div>
    </>
  );
}
