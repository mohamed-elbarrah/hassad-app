"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";

interface PmListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (key: string, values: string[]) => void;
  children?: React.ReactNode;
}

export function PmListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "بحث...",
  filterGroups,
  activeFilters = {},
  onFilterChange,
  children,
}: PmListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex-1 w-full sm:w-auto">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {filterGroups && onFilterChange && (
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />
      )}
      {children}
    </div>
  );
}
