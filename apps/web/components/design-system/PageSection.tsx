import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageSection({
  children,
  title,
  description,
  action,
  className,
}: PageSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {(title || description || action) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && <h2 className="section-title">{title}</h2>}
            {description && <p className="body-text">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
