"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
import { mapContractStatusToUI } from "@/lib/utils/statusMapping";

/**
 * Contract status pill.
 *
 * This is intentionally a *thin wrapper* over the design-system
 * `StatusBadge` — contract statuses map cleanly onto the shared
 * STATUS_MAP, so we don't reinvent the visual. We only normalize
 * the API status → UI status here.
 */
interface ContractStatusPillProps {
  status: string;
}

export function ContractStatusPill({ status }: ContractStatusPillProps) {
  return <StatusBadge status={mapContractStatusToUI(status)} />;
}
