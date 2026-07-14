"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";

interface AdminListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (key: string, values: string[]) => void;
  children?: React.ReactNode;
}

export function AdminListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "بحث...",
  filterGroups,
  activeFilters = {},
  onFilterChange,
  children,
}: AdminListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex-1 w-full sm:w-auto">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="size-4 text-portal-note-text" />}
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
