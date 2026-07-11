"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FinanceDetailBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function FinanceDetailBreadcrumb({
  items,
  className,
}: FinanceDetailBreadcrumbProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-portal-note-text",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 rotate-180" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-secondary-500 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "text-natural-100 font-medium"
                    : "text-portal-note-text"
                }
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
