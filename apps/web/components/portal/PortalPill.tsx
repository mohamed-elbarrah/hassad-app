import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PortalPillTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "blue";

interface PortalPillProps {
  children: ReactNode;
  tone?: PortalPillTone;
  className?: string;
}

const toneClasses: Record<PortalPillTone, string> = {
  neutral: "bg-badge-gray-bg text-secondary-500",
  success: "bg-badge-green-bg text-success-600",
  warning: "bg-badge-yellow-bg text-alert-600",
  danger: "bg-danger-100 text-danger-600",
  purple: "bg-action-purple-soft text-action-purple",
  blue: "bg-action-blue-soft text-action-blue",
};

export function PortalPill({
  children,
  tone = "neutral",
  className,
}: PortalPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-full px-3 text-sm font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}