"use client";

import Link from "next/link";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { PmStatusBadge } from "@/components/dashboard/pm/shared/PmStatusBadge";
import { Calendar, User } from "lucide-react";
import type { Task } from "@hassad/shared";
import { formatShortDate } from "@/lib/format";
import { TaskPriority } from "@hassad/shared";

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_MAP: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "neutral",
  [TaskPriority.NORMAL]: "neutral",
  [TaskPriority.HIGH]: "warning",
  [TaskPriority.URGENT]: "danger",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskWithAssignee extends Task {
  assignee?: { id: string; name: string };
}

interface TaskCardProps {
  task: TaskWithAssignee;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/dashboard/pm/tasks/${task.id}`} className="block">
      <SurfaceCard className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <div className="pb-2 pt-3 px-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium leading-tight line-clamp-2 text-natural-100">
              {task.title}
            </h4>
            <PmStatusBadge
              domain="task"
              status={task.status}
              className="text-[10px] shrink-0"
            />
          </div>
        </div>
        <div className="px-3 pb-3 space-y-2">
          {task.description && (
            <p className="text-xs text-portal-note-text line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-col gap-1 text-[11px] text-portal-note-text">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="size-3 shrink-0" />
                <span>{task.assignee.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="size-3 shrink-0" />
              <span>
                {formatShortDate(task.dueDate)}
              </span>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </Link>
  );
}
