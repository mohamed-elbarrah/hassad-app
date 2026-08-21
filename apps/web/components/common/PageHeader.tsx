import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {Icon ? (
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
          ) : null}
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            {title}
          </h1>
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
