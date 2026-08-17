"use client";

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  showPercentage?: boolean;
  label?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = "var(--color-success-500)",
  trackColor = "var(--color-border-default)",
  className,
  showPercentage = true,
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Defensive: backend may ship null/undefined for completionPercentage.
  // Coerce to a finite number before clamping so we never render NaN%.
  const safeValue = Number.isFinite(value) ? (value as number) : 0;
  const clampedValue = Math.min(100, Math.max(0, safeValue));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transition-all duration-500"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-natural-100">
              {Math.round(clampedValue)}%
            </span>
            {label && (
              <span className="text-xs text-portal-note-text mt-0.5">
                {label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
