"use client";

import { Check, RotateCcw } from "lucide-react";
import { TaskStatus } from "@hassad/shared";
import { cn } from "@/lib/utils";
import { TASK_STATUS_LABELS } from "@/lib/utils/task-status";

interface TaskWorkflowStepperProps {
  currentStatus: TaskStatus;
  revisionCount?: number;
}

const WORKFLOW_STEPS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO, label: TASK_STATUS_LABELS[TaskStatus.TODO] },
  { status: TaskStatus.IN_PROGRESS, label: TASK_STATUS_LABELS[TaskStatus.IN_PROGRESS] },
  { status: TaskStatus.IN_REVIEW, label: TASK_STATUS_LABELS[TaskStatus.IN_REVIEW] },
  { status: TaskStatus.DONE, label: TASK_STATUS_LABELS[TaskStatus.DONE] },
];

export function TaskWorkflowStepper({
  currentStatus,
  revisionCount = 0,
}: TaskWorkflowStepperProps) {
  const currentIndex = WORKFLOW_STEPS.findIndex((step) => step.status === currentStatus);
  const isRevision = currentStatus === TaskStatus.REVISION;
  const effectiveIndex = isRevision ? 2 : currentIndex;

  return (
    <div className="flex w-full flex-col gap-4" role="group" aria-label="مسار حالة المهمة">
      <div className="hidden items-start gap-0 sm:flex">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = effectiveIndex > index;
          const isCurrent = effectiveIndex === index;
          const isPending = effectiveIndex < index;
          return (
            <div key={step.status} className="flex flex-1 items-start last:flex-none" aria-current={isCurrent ? "step" : undefined}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "border-success bg-success text-success-foreground",
                    isCurrent && !isRevision && "border-primary bg-primary text-primary-foreground",
                    isCurrent && isRevision && "border-warning bg-warning text-warning-foreground",
                    isPending && "border-border bg-background text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check aria-hidden="true" /> : isCurrent && isRevision ? <RotateCcw aria-hidden="true" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                </div>
                <span className={cn("whitespace-nowrap text-xs font-medium", isCompleted && "text-success", isCurrent && !isRevision && "text-primary", isCurrent && isRevision && "text-warning", isPending && "text-muted-foreground")}>
                  {step.label}
                </span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <div className="relative mx-2 mt-5 h-0.5 flex-1 rounded-full bg-border" aria-hidden="true">
                  <div className={cn("absolute inset-y-0 start-0 rounded-full", isCompleted && "w-full bg-success")} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = effectiveIndex > index;
          const isCurrent = effectiveIndex === index;
          const isPending = effectiveIndex < index;
          return (
            <div key={step.status} className="flex items-center gap-3" aria-current={isCurrent ? "step" : undefined}>
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border-2", isCompleted && "border-success bg-success text-success-foreground", isCurrent && !isRevision && "border-primary bg-primary text-primary-foreground", isCurrent && isRevision && "border-warning bg-warning text-warning-foreground", isPending && "border-border bg-background text-muted-foreground")}>
                {isCompleted ? <Check aria-hidden="true" /> : <span className="text-xs font-semibold">{index + 1}</span>}
              </div>
              <span className={cn("text-sm font-medium", isCompleted && "text-success", isCurrent && "text-foreground", isPending && "text-muted-foreground")}>{step.label}</span>
              {isCurrent && isRevision && revisionCount > 0 ? <span className="me-auto rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">تعديل #{revisionCount}</span> : null}
            </div>
          );
        })}
      </div>

      {isRevision && revisionCount > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          <RotateCcw className="size-4 shrink-0 text-warning" aria-hidden="true" />
          <span className="text-warning-foreground">تم طلب تعديل {revisionCount > 1 ? `${revisionCount} مرات` : "مرة واحدة"} — يرجى إعادة العمل على المهمة</span>
        </div>
      ) : null}
    </div>
  );
}
