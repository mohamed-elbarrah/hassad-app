"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import type { Task } from "@hassad/shared";
import { TaskStatus, TaskPriority } from "@hassad/shared";

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  TaskPriority,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  [TaskPriority.LOW]: { label: "منخفض", variant: "secondary" },
  [TaskPriority.NORMAL]: { label: "عادي", variant: "outline" },
  [TaskPriority.HIGH]: { label: "عالي", variant: "default" },
  [TaskPriority.URGENT]: { label: "عاجل", variant: "destructive" },
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "للتنفيذ",
  [TaskStatus.IN_PROGRESS]: "قيد التنفيذ",
  [TaskStatus.IN_REVIEW]: "قيد المراجعة",
  [TaskStatus.BLOCKED]: "محظور",
  [TaskStatus.DONE]: "منجز",
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
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-default">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
            {task.title}
          </CardTitle>
          <Badge
            variant={priorityConfig.variant}
            className="text-[10px] shrink-0"
          >
            {priorityConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
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
        <div className="text-[10px] text-muted-foreground border-t pt-1.5">
          {STATUS_LABELS[task.status]}
        </div>
      </CardContent>
    </Card>
  );
}
