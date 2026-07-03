"use client";

import { Search, X } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FinanceListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional filter controls rendered between search and clear button */
  filters?: ReactNode;
  /** Optional export action */
  onExport?: () => void;
  /** Whether any filters are active (shows clear button) */
  hasFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function FinanceListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "بحث...",
  filters,
  onExport,
  hasFilters,
  onClearFilters,
  className,
}: FinanceListToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:items-center gap-3",
        className,
      )}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-note-text pointer-events-none" />
        <FormInputControl
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-10 h-11"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-portal-note-text hover:text-natural-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Custom filters */}
      {filters}

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {hasFilters && onClearFilters && (
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            <X className="w-4 h-4" />
            مسح الفلاتر
          </ActionButton>
        )}
        {onExport && (
          <ActionButton
            variant="outline"
            size="sm"
            onClick={onExport}
          >
            تصدير
          </ActionButton>
        )}
      </div>
    </div>
  );
}
