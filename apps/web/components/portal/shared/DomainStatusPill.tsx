"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
import {
  mapCampaignStatusToUI,
  mapContractStatusToUI,
  mapFinanceStatusToUI,
  mapProposalStatusToUI,
  mapProjectStatusToUI,
} from "@/lib/utils/statusMapping";

type Domain = "campaign" | "contract" | "invoice" | "proposal" | "project";

interface DomainStatusPillProps {
  domain: Domain;
  status: string;
}

const MAPPER: Record<Domain, (s: string) => string> = {
  campaign: mapCampaignStatusToUI,
  contract: mapContractStatusToUI,
  invoice: mapFinanceStatusToUI,
  proposal: mapProposalStatusToUI,
  project: mapProjectStatusToUI,
};

export function DomainStatusPill({ domain, status }: DomainStatusPillProps) {
  return <StatusBadge status={MAPPER[domain](status)} />;
}
