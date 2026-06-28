"use client";

import { Inbox, Search } from "lucide-react";
import { Input } from "@/components/design-system/Input";
import { FilterBar } from "@/components/design-system/FilterBar";
import { CountChip } from "@/components/design-system/CountChip";
import { useFilterGroups } from "@/hooks/useFilterGroups";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/utils/campaign-constants";
import type { PortalCampaign } from "@/features/portal/portalApi";

interface CampaignsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  campaigns: PortalCampaign[] | undefined;
  visibleCount: number;
  totalCount: number;
}

const STATUS_ORDER = ["ACTIVE", "PLANNING", "PAUSED", "COMPLETED", "STOPPED"];

export function CampaignsToolbar({
  search,
  onSearchChange,
  activeFilters,
  onFilterChange,
  campaigns,
  visibleCount,
  totalCount,
}: CampaignsToolbarProps) {
  const filterGroups = useFilterGroups(campaigns, {
    key: "status",
    label: "الحالة",
    pick: (c) => c.status,
    labelMap: CAMPAIGN_STATUS_LABELS,
    preference: STATUS_ORDER,
  });

  const hasFilter =
    search.trim().length > 0 ||
    Object.values(activeFilters).some((v) => v.length > 0);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <Input
          placeholder="ابحث باسم الحملة أو المنصة…"
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
          unfilteredLabel="حملة"
        />
      </div>
    </div>
  );
}