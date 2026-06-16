"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function BriefCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: BriefCardProps) {
  const hasHeader = Boolean(title || description || Icon || action);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-portal-card-border bg-natural-0 shadow-sm",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-portal-divider">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && <Icon className="h-5 w-5 shrink-0 text-secondary-500" />}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-natural-100 truncate">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-portal-note-text truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
