"use client";

import { OperationalClientInfoPanel } from "@/components/client-detail/OperationalClientInfoPanel";
import { useGetPmClientTeamViewQuery } from "@/features/clients/clientsApi";

export function PmClientInfoPanel({
  clientId,
  active,
}: {
  clientId?: string;
  active: boolean;
}) {
  const query = useGetPmClientTeamViewQuery(clientId ?? "", {
    skip: !active || !clientId,
  });

  return (
    <OperationalClientInfoPanel
      clientId={clientId}
      active={active}
      query={query}
    />
  );
}
