"use client";

import { useFilterGroups } from "@/hooks/useFilterGroups";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/utils/campaign-constants";
import { QueueToolbar } from "@/components/portal/shared/QueueToolbar";
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

  return (
    <QueueToolbar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="ابحث باسم الحملة أو المنصة…"
      filterGroups={filterGroups}
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      countLabel="حملة"
      count={visibleCount}
    />
  );
}
