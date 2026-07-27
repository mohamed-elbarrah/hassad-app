import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SalesPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function SalesPageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: SalesPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {Icon ? (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            <Icon className="size-7" />
          </div>
        ) : null}

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold leading-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
