"use client";

import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import {
  FilterBar,
  type FilterGroup,
} from "@/components/design-system/FilterBar";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filterGroups: FilterGroup[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  totalCount: number;
  visibleCount: number;
}

export function Toolbar({
  search,
  onSearchChange,
  filterGroups,
  activeFilters,
  onFilterChange,
  totalCount,
  visibleCount,
}: ToolbarProps) {
  const hasFilter =
    search.trim().length > 0 || hasAnyActiveFilter(activeFilters);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <Input
          placeholder="ابحث باسم المشروع أو المدير…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<Search className="size-4" />}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />

        <CountChip
          hasFilter={hasFilter}
          total={totalCount}
          visible={visibleCount}
        />
      </div>
    </div>
  );
}

function CountChip({
  hasFilter,
  total,
  visible,
}: {
  hasFilter: boolean;
  total: number;
  visible: number;
}) {
  if (hasFilter) {
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg px-2.5",
          "bg-badge-gray-bg text-secondary-500",
          "text-[12px] font-semibold tabular-nums whitespace-nowrap",
        )}
      >
        <span>{visible}</span>
        <span className="text-portal-note-text font-normal">من</span>
        <span>{total}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5",
        "bg-primary-100 text-primary-700 ring-1 ring-inset ring-primary-200",
        "text-[12px] font-semibold whitespace-nowrap",
      )}
    >
      <Inbox className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="tabular-nums">{total}</span>
      <span className="font-normal">مشروع بانتظارك</span>
    </span>
  );
}

function hasAnyActiveFilter(filters: Record<string, string[]>): boolean {
  return Object.values(filters).some((v) => v.length > 0);
}
