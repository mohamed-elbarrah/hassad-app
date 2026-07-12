"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface AdminDetailBreadcrumbProps {
  backHref: string;
  backLabel: string;
  title: string;
  parentHref?: string;
  parentLabel?: string;
}

export function AdminDetailBreadcrumb({
  backHref,
  backLabel,
  title,
  parentHref,
  parentLabel,
}: AdminDetailBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-portal-note-text">
      <Link
        href={backHref}
        className="hover:text-secondary-500 transition-colors"
      >
        {backLabel}
      </Link>
      {parentHref && parentLabel && (
        <>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={parentHref}
            className="hover:text-secondary-500 transition-colors"
          >
            {parentLabel}
          </Link>
        </>
      )}
      <ChevronRight className="w-3 h-3" />
      <span className="text-natural-100 truncate max-w-[200px]">{title}</span>
    </nav>
  );
}
