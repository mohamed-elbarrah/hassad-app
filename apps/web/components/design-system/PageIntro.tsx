import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface PageIntroProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageIntro({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageIntroProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-badge-gray-bg">
            <Icon className="h-7 w-7 text-secondary-500" />
          </div>
        )}

        <div className="space-y-2">
          <h1 className="page-title">
            {title}
          </h1>
          {description && (
            <p className="body-text max-w-3xl text-base">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
