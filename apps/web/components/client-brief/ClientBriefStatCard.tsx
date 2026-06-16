"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientBriefStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down" | "neutral"; value: string } | null;
  colorClass?: string;
  className?: string;
}

export function ClientBriefStatCard({
  icon: Icon,
  label,
  value,
  trend,
  colorClass = "text-secondary-500",
  className,
}: ClientBriefStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-portal-card-border bg-natural-0 p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-portal-note-text truncate">{label}</p>
          <p className="text-xl font-bold text-natural-100 mt-1 truncate">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-1.5",
                trend.direction === "up" && "text-success-600",
                trend.direction === "down" && "text-danger-600",
                trend.direction === "neutral" && "text-neutral-300",
              )}
            >
              {trend.direction === "up"
                ? "↑"
                : trend.direction === "down"
                  ? "↓"
                  : "→"}{" "}
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-secondary-50",
          )}
        >
          <Icon className={cn("h-5 w-5", colorClass)} />
        </div>
      </div>
    </div>
  );
}
