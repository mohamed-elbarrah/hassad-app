"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
import type { ProposalStatus } from "@hassad/shared";
import { mapProposalStatusToUI } from "@/lib/utils/statusMapping";

/**
 * Proposal status pill.
 *
 * Thin wrapper over the design-system `StatusBadge` — proposal
 * statuses map cleanly onto the shared STATUS_MAP, so we don't
 * reinvent the visual. We only normalize the API status → UI
 * status here.
 */
interface ProposalStatusPillProps {
  status: ProposalStatus | string;
}

export function ProposalStatusPill({ status }: ProposalStatusPillProps) {
  return <StatusBadge status={mapProposalStatusToUI(status)} />;
}
