"use client";

import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import { FilterBar } from "@/components/design-system/FilterBar";
import { CountChip } from "@/components/design-system/CountChip";
import { useFilterGroups } from "@/hooks/useFilterGroups";
import type { ReviewProject } from "@/features/portal/portalApi";

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  /** Total count of projects (unfiltered). */
  totalCount: number;
  /** Count of projects after current search/filter. */
  visibleCount: number;
  /** All projects — used to derive filter options. */
  projects?: ReviewProject[];
}

const PROJECT_STATUS_LABEL: Record<string, string> = {
  AWAITING_REVIEW: "بانتظار المراجعة",
  IN_REVIEW: "قيد المراجعة",
  IN_PROGRESS: "قيد التنفيذ",
  NEEDS_REVISION: "مطلوب تعديلات",
  COMPLETED: "مكتمل",
  ACTIVE: "نشط",
  ON_HOLD: "معلق",
  CANCELLED: "ملغي",
  PLANNING: "تخطيط",
};

const STATUS_ORDER = [
  "AWAITING_REVIEW",
  "NEEDS_REVISION",
  "IN_REVIEW",
  "IN_PROGRESS",
  "COMPLETED",
  "ACTIVE",
  "ON_HOLD",
  "CANCELLED",
  "PLANNING",
];

export function Toolbar({
  search,
  onSearchChange,
  activeFilters,
  onFilterChange,
  totalCount,
  visibleCount,
  projects,
}: ToolbarProps) {
  const derivedGroups = useFilterGroups(projects, {
    key: "status",
    label: "الحالة",
    pick: (p) => p.status,
    labelMap: PROJECT_STATUS_LABEL,
    preference: STATUS_ORDER,
  });

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
          groups={derivedGroups}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
        />

        <CountChip
          hasFilter={hasFilter}
          total={totalCount}
          visible={visibleCount}
          icon={<Inbox className="h-3.5 w-3.5" />}
          unfilteredLabel="مشروع بانتظارك"
        />
      </div>
    </div>
  );
}

function hasAnyActiveFilter(filters: Record<string, string[]>): boolean {
  return Object.values(filters).some((v) => v.length > 0);
}