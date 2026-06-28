"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import {
  FilterBar,
} from "@/components/design-system/FilterBar";
import { CountChip } from "@/components/design-system/CountChip";
import { Inbox } from "lucide-react";
import { ProposalStatus } from "@hassad/shared";
import { useFilterGroups } from "@/hooks/useFilterGroups";
import type { ProposalListItem } from "@/features/proposals/proposalsApi";

interface ProposalsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  proposals: ProposalListItem[] | undefined;
  visibleCount: number;
  totalCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "بانتظار المراجعة",
  APPROVED: "معتمد",
  REVISION_REQUESTED: "مطلوب تعديلات",
  REJECTED: "مرفوض",
};

const STATUS_ORDER = [
  ProposalStatus.SENT,
  ProposalStatus.REVISION_REQUESTED,
  ProposalStatus.APPROVED,
  ProposalStatus.DRAFT,
  ProposalStatus.REJECTED,
];

export function ProposalsToolbar({
  search,
  onSearchChange,
  activeFilters,
  onFilterChange,
  proposals,
  visibleCount,
  totalCount,
}: ProposalsToolbarProps) {
  const filterGroups = useFilterGroups(proposals, {
    key: "status",
    label: "الحالة",
    pick: (p) => p.status,
    labelMap: STATUS_LABEL,
    preference: STATUS_ORDER,
  });

  const hasFilter =
    search.trim().length > 0 ||
    Object.values(activeFilters).some((v) => v.length > 0);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <Input
          placeholder="ابحث باسم العرض أو الشركة…"
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
          icon={<Inbox className="h-3.5 w-3.5" />}
          unfilteredLabel="عرض بانتظارك"
        />
      </div>
    </div>
  );
}