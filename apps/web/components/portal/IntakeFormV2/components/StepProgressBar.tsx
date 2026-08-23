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

      <div className="hidden md:flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = i === currentStep;
          const isSkipped = skippedSteps.includes(i);

          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5 flex-1",
                  isCurrent && "text-primary",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                    isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110",
                    isCompleted &&
                      "bg-accent text-accent-foreground border-accent",
                    isCurrent &&
                      !isCompleted &&
                      "bg-primary text-primary-foreground border-primary",
                    isSkipped &&
                      "bg-warning text-warning-foreground border-warning border-dashed",
                    !isCompleted &&
                      !isCurrent &&
                      !isSkipped &&
                      "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {isCompleted ? "✓" : isSkipped ? "!" : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden lg:block max-w-24 text-center text-[11px] leading-tight text-muted-foreground",
                    isCurrent && "font-bold text-primary",
                  )}
                >
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors",
                      isCompleted
                        ? "bg-accent"
                        : isSkipped
                          ? "bg-warning"
                          : "bg-border",
                    )}
                  />
                )}
              </div>
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
