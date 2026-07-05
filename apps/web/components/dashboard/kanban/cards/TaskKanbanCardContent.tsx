"use client";

import Link from "next/link";
import { Calendar, GripVertical, User } from "lucide-react";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { TaskStatus } from "@hassad/shared";
import { formatShortDate } from "@/lib/format";
import {
  TASK_STATUS_COLOR,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/utils/task-status";
import type { TaskWithMeta } from "@/lib/utils/task-status";

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
  const statusColor = TASK_STATUS_COLOR[task.status as TaskStatus];

  const priorityTone =
    task.priority === "URGENT"
      ? "danger"
      : task.priority === "HIGH"
        ? "warning"
        : "neutral";

  return (
    <>
      {/* ── Header: Title + Drag Handle ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`${detailPath}/${task.id}`}
          className="text-sm font-semibold leading-tight hover:underline line-clamp-2 block flex-1 min-w-0 transition-colors"
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

      {/* ── Description ────────────────────────────────────────────── */}
      {task.description && (
        <p
          className="text-xs mt-2 line-clamp-2 leading-relaxed"
          style={{ color: "#A8ABB2" }}
        >
          {task.description}
        </p>
      )}

      {/* ── Status indicator bar ───────────────────────────────────── */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className="h-1.5 flex-1 rounded-full"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width:
                task.status === TaskStatus.DONE
                  ? "100%"
                  : task.status === TaskStatus.IN_PROGRESS
                    ? "50%"
                    : "15%",
              backgroundColor: statusColor,
            }}
          />
        </div>
      </div>

      {/* ── Priority & Status badges ──────────────────────────────── */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge
          status={priorityTone}
          label={
            TASK_PRIORITY_LABELS[
              task.priority as keyof typeof TASK_PRIORITY_LABELS
            ] ?? task.priority
          }
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

      {/* ── Meta: Assignee & Due Date ──────────────────────────────── */}
      <div
        className="mt-2 flex flex-col gap-1 text-[11px]"
        style={{ color: "#A8ABB2" }}
      >
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
    </>
  );
}
