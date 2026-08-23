"use client";

import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "البيانات الشخصية",
  "بيانات النشاط",
  "المنتج / الخدمة",
  "الجمهور والرسائل",
  "رحلة العميل",
  "الحملة الإعلانية",
  "الأداء والميزانية",
  "الهوية البصرية",
  "المراجعة",
];

interface StepProgressBarProps {
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
}

export function StepProgressBar({
  currentStep,
  completedSteps,
  skippedSteps,
}: StepProgressBarProps) {
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span aria-live="polite">
          الخطوة {currentStep + 1} من {STEP_LABELS.length}
        </span>
        <span className="font-medium text-foreground">
          {STEP_LABELS[currentStep]}
        </span>
      </div>

      <div className="hidden md:grid grid-cols-9 items-start" role="list" aria-label="خطوات إعداد الملف الشخصي">
        {STEP_LABELS.map((label, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = i === currentStep;
          const isSkipped = skippedSteps.includes(i);

          return (
            <div
              key={label}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-2",
                isCurrent && "text-primary",
              )}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
            >
              {i < STEP_LABELS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute start-1/2 top-4 z-0 h-0.5 w-full",
                    isCompleted
                      ? "bg-accent"
                      : isSkipped
                        ? "bg-warning"
                        : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                  isCurrent && "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background",
                  isCompleted && "border-accent bg-accent text-accent-foreground",
                  isCurrent && !isCompleted && "border-primary bg-primary text-primary-foreground",
                  isSkipped && "border-warning border-dashed bg-warning text-warning-foreground",
                  !isCompleted && !isCurrent && !isSkipped && "border-border bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? "✓" : isSkipped ? "!" : i + 1}
              </span>
              <span
                className={cn(
                  "hidden min-h-8 max-w-24 text-center text-[11px] leading-tight text-muted-foreground lg:block",
                  isCurrent && "font-bold text-primary",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div
        role="group"
        className="md:hidden flex flex-col items-center gap-3"
        aria-label="تقدم نموذج إعداد الملف الشخصي"
      >
        <div className="flex items-center justify-center gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = i === currentStep;
          const isSkipped = skippedSteps.includes(i);
          return (
            <div
              key={i}
              role="img"
              aria-label={`${label}: ${isCurrent ? "الحالية" : isCompleted ? "مكتملة" : isSkipped ? "متجاوزة" : "قادمة"}`}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "h-2.5 rounded-full transition-colors",
                isCurrent &&
                  "w-6 bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-110",
                isCompleted && "w-2.5 bg-accent",
                isSkipped && "w-2.5 bg-warning",
                !isCompleted && !isCurrent && !isSkipped && "w-2.5 bg-muted",
              )}
            />
          );
        })}
        </div>
        <span className="text-sm font-medium text-foreground" aria-live="polite">
          {STEP_LABELS[currentStep]}
        </span>
      </div>
    </div>
  );
}

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-4">
      <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold">
        {currentStep + 1} / {STEP_LABELS.length}
      </span>
    </div>
  );
}
