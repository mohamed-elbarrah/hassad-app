"use client";

import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatus } from "@hassad/shared";
import { TASK_STATUS_LABELS } from "@/lib/utils/task-status";

// ── Types ────────────────────────────────────────────────────────────────────

interface TaskWorkflowStepperProps {
  currentStatus: TaskStatus;
  revisionCount?: number;
}

// ── Workflow definition ─────────────────────────────────────────────────────

const WORKFLOW_STEPS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO, label: TASK_STATUS_LABELS[TaskStatus.TODO] },
  {
    status: TaskStatus.IN_PROGRESS,
    label: TASK_STATUS_LABELS[TaskStatus.IN_PROGRESS],
  },
  {
    status: TaskStatus.IN_REVIEW,
    label: TASK_STATUS_LABELS[TaskStatus.IN_REVIEW],
  },
  { status: TaskStatus.DONE, label: TASK_STATUS_LABELS[TaskStatus.DONE] },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskWorkflowStepper({
  currentStatus,
  revisionCount = 0,
}: TaskWorkflowStepperProps) {
  const currentIndex = WORKFLOW_STEPS.findIndex(
    (s) => s.status === currentStatus,
  );
  // If in REVISION, visually show we're at IN_REVIEW with a warning
  const isRevision = currentStatus === TaskStatus.REVISION;
  const effectiveIndex = isRevision ? 2 : currentIndex;

  return (
    <div className="w-full">
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center gap-0">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = effectiveIndex > index;
          const isCurrent = effectiveIndex === index;
          const isPending = effectiveIndex < index;

          return (
            <div
              key={step.status}
              className="flex items-center flex-1 last:flex-none"
            >
              {/* Step circle */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    isCompleted &&
                      "bg-emerald-500 border-emerald-500 text-white",
                    isCurrent &&
                      !isRevision &&
                      "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200",
                    isCurrent &&
                      isRevision &&
                      "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200",
                    isPending &&
                      "bg-white border-portal-card-border text-portal-note-text",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent && isRevision ? (
                    <RotateCcw className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCompleted && "text-emerald-700",
                    isCurrent && !isRevision && "text-blue-700",
                    isCurrent && isRevision && "text-amber-700",
                    isPending && "text-portal-note-text",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative">
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full",
                      isCompleted ? "bg-emerald-300" : "bg-portal-divider",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="sm:hidden flex flex-col gap-3">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = effectiveIndex > index;
          const isCurrent = effectiveIndex === index;
          const isPending = effectiveIndex < index;

          return (
            <div key={step.status} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                  isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                  isCurrent &&
                    !isRevision &&
                    "bg-blue-500 border-blue-500 text-white",
                  isCurrent &&
                    isRevision &&
                    "bg-amber-500 border-amber-500 text-white",
                  isPending &&
                    "bg-white border-portal-card-border text-portal-note-text",
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-emerald-700",
                  isCurrent && "text-natural-100",
                  isPending && "text-portal-note-text",
                )}
              >
                {step.label}
              </span>
              {isCurrent && isRevision && revisionCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mr-auto">
                  تعديل #{revisionCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Revision warning banner */}
      {isRevision && revisionCount > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm">
          <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-amber-800">
            تم طلب تعديل{" "}
            {revisionCount > 1 ? `${revisionCount} مرات` : "مرة واحدة"} — يرجى
            إعادة العمل على المهمة
          </span>
        </div>
      )}
    </div>
  );
}
