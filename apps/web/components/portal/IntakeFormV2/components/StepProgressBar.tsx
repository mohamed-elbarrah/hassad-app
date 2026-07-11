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
}

export function StepProgressBar({
  currentStep,
  completedSteps,
}: StepProgressBarProps) {
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between text-xs text-portal-icon">
        <span>
          الخطوة {currentStep + 1} من {STEP_LABELS.length}
        </span>
      </div>

      <div className="hidden md:flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = i === currentStep;

          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors border-2",
                    isCompleted &&
                      "bg-secondary-500 text-white border-secondary-500",
                    isCurrent &&
                      !isCompleted &&
                      "bg-secondary-100 text-secondary-700 border-secondary-500",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-natural-0 text-portal-icon border-portal-divider",
                  )}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors",
                      isCompleted || (isCurrent && i < currentStep)
                        ? "bg-secondary-500"
                        : "bg-portal-divider",
                    )}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:hidden flex items-center justify-center gap-1">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              i === currentStep && "bg-secondary-500 w-4",
              completedSteps.includes(i) && "bg-secondary-300",
              i > currentStep &&
                !completedSteps.includes(i) &&
                "bg-portal-divider",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-4">
      <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-lg text-sm font-semibold">
        {currentStep + 1} / {STEP_LABELS.length}
      </span>
    </div>
  );
}
