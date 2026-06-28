"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapCampaignStatusToUI } from "@/lib/utils/statusMapping";

/**
 * Campaign status pill.
 *
 * Thin wrapper over the design-system `StatusBadge` — campaign
 * statuses map cleanly onto the shared STATUS_MAP, so we don't
 * reinvent the visual. We only normalize the API status → UI
 * status here.
 */
interface CampaignStatusPillProps {
  status: string;
}

export function CampaignStatusPill({ status }: CampaignStatusPillProps) {
  return <StatusBadge status={mapCampaignStatusToUI(status)} />;
}
