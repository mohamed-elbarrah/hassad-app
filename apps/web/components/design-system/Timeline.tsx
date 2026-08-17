"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TimelineItemProps {
  title: string;
  description?: ReactNode;
  timestamp?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  isLast?: boolean;
}

const nodeColors = {
  default: "bg-neutral-200",
  success: "bg-success-500",
  warning: "bg-alert-500",
  danger: "bg-danger-500",
};

export function TimelineItem({
  title,
  description,
  timestamp,
  icon,
  variant = "default",
  isLast,
}: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            nodeColors[variant],
          )}
        >
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-neutral-200 my-1" />}
      </div>
      <div className="pb-6">
        <p className="text-sm font-medium text-natural-100">{title}</p>
        {description && (
          <div className="text-sm text-neutral-300 mt-0.5">{description}</div>
        )}
        {timestamp && (
          <p className="text-xs text-neutral-200 mt-1">{timestamp}</p>
        )}
      </div>
    </div>
  );
}
