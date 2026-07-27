"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  SalesFilterBar,
  type SalesFilterGroup,
} from "@/components/dashboard/sales/shared/SalesFilterBar";

interface SalesListToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: SalesFilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (groupKey: string, values: string[]) => void;
  countLabel: string;
  count: number;
  actions?: ReactNode;
}

export function SalesListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "ابحث...",
  filterGroups,
  activeFilters,
  onFilterChange,
  countLabel,
  count,
  actions,
}: SalesListToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-xl pr-10"
          />
        </div>
        {actions}
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {count} {countLabel}
        </span>
      </div>
      {filterGroups && activeFilters && onFilterChange ? (
        <SalesFilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />
      ) : null}
    </div>
  );
}
