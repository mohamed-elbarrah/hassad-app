"use client";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  extra?: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-natural-0 border-portal-card-border",
  success: "bg-success-100/30 border-success-200",
  warning: "bg-alert-100/30 border-alert-200",
  danger: "bg-danger-100/30 border-danger-200",
};

const trendColors = {
  up: "text-success-600",
  down: "text-danger-600",
  neutral: "text-neutral-300",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
  trendValue,
  extra,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[30px] border-[1.5px] p-5",
        variantClasses[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-neutral-300">{title}</p>
          <p className="text-2xl font-semibold text-natural-100">{value}</p>
          {trend && (
            <p className={cn("text-xs font-medium", trendColors[trend])}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && <Icon className="h-5 w-5 text-secondary-500" />}
          {extra}
        </div>
      </div>
    </div>
  );
}
