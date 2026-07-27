"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SalesPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getVisiblePages(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  if (rangeStart > 2) {
    pages.push("...");
  } else if (rangeStart === 2) {
    pages.push(2);
  }

  for (let i = Math.max(2, rangeStart); i <= Math.min(total - 1, rangeEnd); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (rangeEnd < total - 2) {
    pages.push("...");
  } else if (rangeEnd === total - 2) {
    pages.push(total - 1);
  }

  if (!pages.includes(total)) {
    pages.push(total);
  }

  return pages;
}

export function SalesPagination({
  page,
  totalPages,
  onPageChange,
}: SalesPaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="flex items-center gap-1.5" dir="rtl">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="الصفحة السابقة"
        className="size-9 rounded-lg"
      >
        <ChevronRight className="size-4" />
      </Button>

      <div className="flex items-center gap-1">
        {visiblePages.map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`${item}-${index}`}
                className="inline-flex size-9 items-center justify-center text-sm text-muted-foreground"
              >
                …
              </span>
            );
          }

          const isActive = item === page;

          return (
            <Button
              key={item}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(item)}
              aria-label={`الصفحة ${item}`}
              aria-current={isActive ? "page" : undefined}
              className="min-w-9 rounded-lg px-2"
            >
              {item}
            </Button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="الصفحة التالية"
        className="size-9 rounded-lg"
      >
        <ChevronLeft className="size-4" />
      </Button>
    </div>
  );
}
