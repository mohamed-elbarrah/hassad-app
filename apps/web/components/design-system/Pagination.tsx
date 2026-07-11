"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Generate visible page numbers with ellipsis.
 * Shows first, last, current, and adjacent pages.
 * Example: [1, '...', 4, 5, 6, '...', 10]
 */
function getVisiblePages(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  // Add ellipsis after first page if needed
  if (rangeStart > 2) {
    pages.push("...");
  } else if (rangeStart === 2) {
    pages.push(2);
  }

  // Add middle range
  for (
    let i = Math.max(2, rangeStart);
    i <= Math.min(total - 1, rangeEnd);
    i++
  ) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Add ellipsis before last page if needed
  if (rangeEnd < total - 2) {
    pages.push("...");
  } else if (rangeEnd === total - 2) {
    pages.push(total - 1);
  }

  // Always show last page
  if (!pages.includes(total)) {
    pages.push(total);
  }

  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center gap-1.5" dir="rtl">
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => canGoPrev && onPageChange(page - 1)}
        disabled={!canGoPrev}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all duration-150",
          "border-portal-card-border bg-natural-0 text-portal-icon",
          "hover:border-secondary-500 hover:text-secondary-500 hover:bg-secondary-50",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-portal-card-border disabled:hover:text-portal-icon disabled:hover:bg-natural-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/20",
        )}
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((item, index) => {
          const key = `${item}-${index}`;

          if (item === "...") {
            return (
              <span
                key={key}
                className="inline-flex h-9 w-9 items-center justify-center text-sm text-neutral-300 select-none"
              >
                …
              </span>
            );
          }

          const isActive = item === page;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onPageChange(item)}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/20",
                isActive
                  ? "bg-secondary-500 text-white border border-secondary-500 shadow-sm"
                  : "border border-portal-card-border bg-natural-0 text-portal-icon hover:border-secondary-500 hover:text-secondary-500 hover:bg-secondary-50",
              )}
              aria-label={`الصفحة ${item}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => canGoNext && onPageChange(page + 1)}
        disabled={!canGoNext}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all duration-150",
          "border-portal-card-border bg-natural-0 text-portal-icon",
          "hover:border-secondary-500 hover:text-secondary-500 hover:bg-secondary-50",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-portal-card-border disabled:hover:text-portal-icon disabled:hover:bg-natural-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/20",
        )}
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
