"use client";

import { Badge } from "@/components/ui/badge";
import {
  mapCampaignStatusToUI,
  mapContractStatusToUI,
  mapFinanceStatusToUI,
  mapProposalStatusToUI,
  mapProjectStatusToUI,
} from "@/lib/utils/statusMapping";

type Domain = "campaign" | "contract" | "invoice" | "proposal" | "project";
const MAPPER: Record<Domain, (status: string) => string> = {
  campaign: mapCampaignStatusToUI,
  contract: mapContractStatusToUI,
  invoice: mapFinanceStatusToUI,
  proposal: mapProposalStatusToUI,
  project: mapProjectStatusToUI,
};

export function DomainStatusPill({
  domain,
  status,
}: {
  domain: Domain;
  status: string;
}) {
  const label = MAPPER[domain](status);
  return (
    <Badge
      variant={
        label === "DANGER"
          ? "destructive"
          : label === "COMPLETED"
            ? "default"
            : "secondary"
      }
    >
      {label}
    </Badge>
  );
}
