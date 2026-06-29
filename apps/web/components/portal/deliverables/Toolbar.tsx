"use client";

import { useFilterGroups } from "@/hooks/useFilterGroups";
import { QueueToolbar } from "@/components/portal/shared/QueueToolbar";
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

  return (
    <QueueToolbar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="ابحث باسم المشروع أو المدير…"
      filterGroups={derivedGroups}
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      countLabel="مشروع"
      count={visibleCount}
    />
  );
}
