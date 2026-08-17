import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SurfaceCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  dir?: string;
}

export function SurfaceCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: SurfaceCardProps) {
  const hasHeader = Boolean(title || description || Icon || action);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-card border border-border-default bg-surface",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-col gap-4 border-b-[1.5px] border-portal-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            {Icon && (
              <Icon className="mt-1 h-7 w-7 shrink-0 text-portal-icon" />
            )}

            <div className="space-y-1">
              {title && (
                <h2 className="section-title font-medium">
                  {title}
                </h2>
              )}
              {description && (
                <p className="body-text">
                  {description}
                </p>
              )}
            </div>
          </div>

          {action && (
            <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
              {action}
            </div>
          )}
        </div>
      )}

      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
