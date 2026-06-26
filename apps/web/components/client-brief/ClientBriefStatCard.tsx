"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone =
  | "secondary"
  | "success"
  | "primary"
  | "danger"
  | "action-blue"
  | "action-purple";

interface ClientBriefStatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  trend?: { direction: "up" | "down" | "neutral"; value: string } | null;
  tone?: StatTone;
  colorClass?: string;
  className?: string;
}

const toneClasses: Record<StatTone, { iconBg: string; iconText: string }> = {
  secondary: { iconBg: "bg-secondary-50", iconText: "text-secondary-500" },
  success: { iconBg: "bg-success-50", iconText: "text-success-500" },
  primary: { iconBg: "bg-primary-50", iconText: "text-primary-500" },
  danger: { iconBg: "bg-danger-50", iconText: "text-danger-500" },
  "action-blue": {
    iconBg: "bg-action-blue-soft",
    iconText: "text-action-blue",
  },
  "action-purple": {
    iconBg: "bg-action-purple-soft",
    iconText: "text-action-purple",
  },
};

export function ClientBriefStatCard({
  icon: Icon,
  label,
  value,
  trend,
  tone = "secondary",
  colorClass,
  className,
}: ClientBriefStatCardProps) {
  const toneStyle = toneClasses[tone];

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
            "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
            toneStyle.iconBg,
          )}
        >
          <Icon className={cn("h-5 w-5", colorClass ?? toneStyle.iconText)} />
        </div>
      </div>
    </div>
  );
}
