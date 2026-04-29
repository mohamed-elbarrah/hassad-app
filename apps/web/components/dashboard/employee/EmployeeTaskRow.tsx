"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Archive, ArchiveRestore } from "lucide-react";
import { TaskStatus, TaskPriority, TaskDepartment } from "@hassad/shared";
import type { TaskWithProject } from "@/features/tasks/tasksApi";

// ── Labels ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "للتنفيذ",
  [TaskStatus.IN_PROGRESS]: "قيد التنفيذ",
  [TaskStatus.IN_REVIEW]: "قيد المراجعة",
  [TaskStatus.REVISION]: "يحتاج تعديل",
  [TaskStatus.DONE]: "منجز",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "منخفض",
  [TaskPriority.NORMAL]: "عادي",
  [TaskPriority.HIGH]: "عالي",
  [TaskPriority.URGENT]: "عاجل",
};

const DEPARTMENT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "تصميم",
  [TaskDepartment.MARKETING]: "تسويق",
  [TaskDepartment.DEVELOPMENT]: "تطوير",
  [TaskDepartment.CONTENT]: "محتوى",
  [TaskDepartment.PRODUCTION]: "مونتاج",
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TaskWithProject;
  onArchive: (id: string) => void;
  isArchiving?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmployeeTaskRow({
  task,
  onArchive,
  isArchiving,
}: TaskRowProps) {
  const isOverdue =
    task.dueDate != null &&
    task.status !== TaskStatus.DONE &&
    new Date(task.dueDate) < new Date();

  const dueDateFormatted = task.dueDate
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(task.dueDate))
    : null;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Title + project */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/dashboard/employee/tasks/${task.id}`}
            className="text-sm font-medium hover:underline line-clamp-1"
          >
            {task.title}
          </Link>
          {task.project && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {task.project.name}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <Badge variant="outline">{STATUS_LABELS[task.status]}</Badge>
          <Badge variant={PRIORITY_VARIANT[task.priority]}>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          {task.department?.name && (
            <Badge variant="secondary">
              {DEPARTMENT_LABELS[task.department.name as TaskDepartment] ??
                task.department.name}
            </Badge>
          )}
        </div>

        {/* Due date */}
        {dueDateFormatted && (
          <p
            className={`text-xs shrink-0 ${
              isOverdue
                ? "text-destructive font-medium"
                : "text-muted-foreground"
            }`}
          >
            {dueDateFormatted}
          </p>
        )}

        {/* Archive toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={isArchiving}
          onClick={() => onArchive(task.id)}
          title={task.isArchived ? "إلغاء الأرشفة" : "أرشفة"}
        >
          {task.isArchived ? (
            <ArchiveRestore className="size-4" />
          ) : (
            <Archive className="size-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
