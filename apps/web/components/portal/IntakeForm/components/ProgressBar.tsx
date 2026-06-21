"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
}

export function ProgressBar({ currentStep, totalSteps, progress }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>الخطوة {currentStep}</span>
        <span>{Math.round(progress)}% مكتمل</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-secondary-500 to-secondary-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
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
