"use client";

import { OperationalClientInfoPanel } from "@/components/client-detail/OperationalClientInfoPanel";
import { useGetTeamClientInfoQuery } from "@/features/team/teamApi";

export function TeamClientInfoPanel({
  clientId,
  active,
}: {
  clientId?: string;
  active: boolean;
}) {
  const query = useGetTeamClientInfoQuery(clientId ?? "", {
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
