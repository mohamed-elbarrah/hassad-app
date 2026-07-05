"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";

interface QueueToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (groupKey: string, values: string[]) => void;
  countLabel: string;
  count: number;
  actions?: ReactNode;
}

export function QueueToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "ابحث...",
  filterGroups,
  activeFilters,
  onFilterChange,
  countLabel,
  count,
  actions,
}: QueueToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-portal-icon" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-12 pr-10 rounded-xl border-[1.5px] border-portal-card-border bg-natural-0 text-sm"
          />
        </div>
        {actions}
        <span className="text-sm text-portal-note-text whitespace-nowrap">
          {count} {countLabel}
        </span>
      </div>
      {filterGroups && activeFilters && onFilterChange && (
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />
      )}
    </div>
  );
}
