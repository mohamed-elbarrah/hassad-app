"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PortalInfoPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  variant?: "default" | "bordered" | "filled";
}

export function PortalInfoPanel({
  title,
  description,
  children,
  className,
  variant = "default",
}: PortalInfoPanelProps) {
  const variants = {
    default:
      "rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4",
    bordered:
      "rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 p-4",
    filled:
      "rounded-2xl border-[1.5px] border-portal-card-border bg-portal-bg p-4",
  };

  return (
    <div className={cn(variants[variant], className)}>
      {(title || description) && (
        <div className="space-y-1 mb-3">
          {title && (
            <p className="text-base font-medium text-natural-100">{title}</p>
          )}
          {description && (
            <p className="text-sm leading-6 text-portal-note-text">
              {description}
            </p>
          )}
        </div>
      )}
      {children && <div className="space-y-2">{children}</div>}
    </div>
  );
}
