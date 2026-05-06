import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface PortalPageIntroProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PortalPageIntro({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PortalPageIntroProps) {
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
          <h1 className="text-[28px] font-semibold leading-[1.2] text-natural-100 lg:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-base leading-7 text-portal-note-text">
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