"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SalesDetailBreadcrumbProps {
  backHref: string;
  backLabel: string;
  title: string;
}

export function SalesDetailBreadcrumb({
  backHref,
  backLabel,
  title,
}: SalesDetailBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link
        href={backHref}
        className="flex items-center gap-1 transition-colors hover:text-primary"
      >
        <ArrowRight className="size-4" />
        {backLabel}
      </Link>
      <span>/</span>
      <span className="max-w-[300px] truncate font-medium text-foreground">
        {title}
      </span>
    </div>
  );
}
