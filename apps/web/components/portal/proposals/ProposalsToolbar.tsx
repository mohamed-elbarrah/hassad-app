"use client";

import { ProposalStatus } from "@hassad/shared";
import { useFilterGroups } from "@/hooks/useFilterGroups";
import { QueueToolbar } from "@/components/portal/shared/QueueToolbar";
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

  return (
    <QueueToolbar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="ابحث باسم العرض أو الشركة…"
      filterGroups={filterGroups}
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      countLabel="طلب"
      count={visibleCount}
    />
  );
}
