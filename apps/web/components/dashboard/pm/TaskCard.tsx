"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Calendar, User } from "lucide-react";
import type { Task } from "@hassad/shared";
import { TaskStatus, TaskPriority } from "@hassad/shared";

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
            <h4 className="text-sm font-medium leading-tight line-clamp-2">
              {task.title}
            </h4>
            <StatusBadge
              status={PRIORITY_MAP[task.priority]}
              label={PRIORITY_LABELS[task.priority]}
              className="text-[10px] shrink-0"
            />
          </div>
        </div>
        <div className="px-3 pb-3 space-y-2">
          {task.description && (
            <p className="text-xs text-neutral-300 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-col gap-1 text-[11px] text-neutral-300">
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
          <div className="text-[10px] text-neutral-300 border-t pt-1.5">
            {STATUS_LABELS[task.status]}
          </div>
        </div>
      </SurfaceCard>
    </Link>
  );
}
