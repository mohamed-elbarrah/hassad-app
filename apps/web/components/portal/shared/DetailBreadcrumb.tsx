"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DetailBreadcrumbProps {
  backHref: string;
  backLabel: string;
  title: string;
}

export function DetailBreadcrumb({
  backHref,
  backLabel,
  title,
}: DetailBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-portal-note-text">
      <Link
        href={backHref}
        className="flex items-center gap-1 hover:text-secondary-500 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        {backLabel}
      </Link>
      <span>/</span>
      <span className="text-natural-100 font-medium truncate max-w-[300px]">
        {title}
      </span>
    </div>
  );
}
