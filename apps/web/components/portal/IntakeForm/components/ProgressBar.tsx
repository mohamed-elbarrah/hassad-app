"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

interface ProgressBarProps {
  currentSection: number;
  totalSections: number;
  progress: number;
  sectionTitles: string[];
}

export function ProgressBar({
  currentSection,
  totalSections,
  progress,
  sectionTitles,
}: ProgressBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>القسم {currentSection + 1} من {totalSections}</span>
        <span>{Math.round(progress)}% مكتمل</span>
      </div>
      
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-secondary-500 to-secondary-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="hidden md:flex items-center justify-between gap-2 pt-2">
        {sectionTitles.map((title, index) => (
          <div
            key={title}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              index <= currentSection ? "text-secondary-600" : "text-neutral-400"
            )}
          >
            {index < currentSection ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : index === currentSection ? (
              <Circle className="w-4 h-4 fill-secondary-500 text-secondary-500" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
            <span className="hidden lg:inline">{title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-lg text-sm font-semibold">
        {currentStep} / {totalSteps}
      </span>
    </div>
  );
}
