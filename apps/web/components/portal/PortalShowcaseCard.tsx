import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PortalShowcaseCardProps {
  title: string;
  status?: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  preview?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function PortalShowcaseCard({
  title,
  status,
  meta,
  body,
  preview,
  footer,
  className,
}: PortalShowcaseCardProps) {
  return (
    <article
      className={cn(
        "rounded-[30px] border-[1.5px] border-portal-card-border bg-natural-0 p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-[1.5px] border-portal-divider pb-5">
        <div className="min-w-0 flex-1 space-y-2 text-right">
          <h3 className="text-[22px] font-semibold leading-9 text-natural-100">{title}</h3>
          {meta}
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>

      {body ? <div className="mt-4">{body}</div> : null}
      {preview ? <div className="mt-5">{preview}</div> : null}

      {footer ? (
        <div className="mt-5 border-t-[1.5px] border-portal-divider pt-4">{footer}</div>
      ) : null}
    </article>
  );
}