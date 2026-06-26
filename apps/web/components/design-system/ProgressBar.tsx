"use client";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const variantFill = {
  default: "bg-secondary-500",
  success: "bg-success-500",
  warning: "bg-alert-500",
  danger: "bg-danger-500",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  // Defensive: backend may ship null/undefined for completionPercentage.
  // Coerce to a finite number so we never render NaN% or a broken bar.
  const safeValue = Number.isFinite(value) ? (value as number) : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const pct = Math.min(100, Math.max(0, (safeValue / safeMax) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full rounded-full bg-neutral-100 overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            variantFill[variant],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-neutral-300 mt-1">{pct.toFixed(0)}%</span>
      )}
    </div>
  );
}
