"use client";

import Link from "next/link";
import { Calendar, GripVertical, User } from "lucide-react";
import { TaskStatus } from "@hassad/shared";
import { formatShortDate } from "@/lib/format";
import {
  TASK_STATUS_TONES,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/utils/task-status";
import type { TaskWithMeta } from "@/lib/utils/task-status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskKanbanCardContentProps {
  task: TaskWithMeta;
  /** Base path for task detail links (e.g. /dashboard/pm/tasks or /dashboard/employee/tasks) */
  detailPath: string;
}

/**
 * Card content for the task status kanban.
 *
 * Renders task title, description, status indicator bar, priority badge,
 * status badge, assignee, and due date.
 */
export function TaskKanbanCardContent({
  task,
  detailPath,
}: TaskKanbanCardContentProps) {
  const statusTone = TASK_STATUS_TONES[task.status as TaskStatus];

  return (
    <>
      {/* ── Header: Title + Drag Handle ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`${detailPath}/${task.id}`}
          className="block flex-1 min-w-0 text-sm font-semibold leading-tight line-clamp-2 transition-colors text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-40 text-muted-foreground" />
      </div>

      {/* ── Description ────────────────────────────────────────────── */}
      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      )}

      {/* ── Status indicator bar ───────────────────────────────────── */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", statusTone.fillClass)}
            style={{
              width:
                task.status === TaskStatus.DONE
                  ? "100%"
                  : task.status === TaskStatus.IN_PROGRESS
                    ? "50%"
                    : "15%",
            }}
          />
        </div>
      </div>

      {/* ── Priority & Status badges ──────────────────────────────── */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {TASK_PRIORITY_LABELS[
            task.priority as keyof typeof TASK_PRIORITY_LABELS
          ] ?? task.priority}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-[11px]", statusTone.badgeClass)}
        >
          {TASK_STATUS_LABELS[task.status as TaskStatus]}
        </Badge>
      </div>

      {/* ── Meta: Assignee & Due Date ──────────────────────────────── */}
      <div className="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span>{task.assignee.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatShortDate(task.dueDate)}</span>
        </div>
      </div>
    </>
  );
}
