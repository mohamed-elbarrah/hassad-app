"use client";

import { ClientInfoPanel } from "@/components/client-detail/ClientInfoPanel";
import { useGetPmClientTeamViewQuery } from "@/features/clients/clientsApi";
import { clientWorkflowErrorMessage } from "@/lib/i18n";
import { mapPmClientTeamView } from "@/lib/mapPmClientTeamView";

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

  const teamView = query.currentData;
  const hasCurrentTeamView = Boolean(
    clientId && teamView?.client.id === clientId,
  );
  const error =
    query.isError && query.originalArgs === clientId ? query.error : undefined;

  return (
    <ClientInfoPanel
      clientId={clientId}
      client={
        hasCurrentTeamView && teamView
          ? mapPmClientTeamView(teamView)
          : undefined
      }
      mode="pm"
      isLoading={
        !active ||
        (query.isFetching && !hasCurrentTeamView) ||
        (!hasCurrentTeamView && !error)
      }
      error={error}
      errorMessage={clientWorkflowErrorMessage}
      onRetry={query.refetch}
    />
  );
}
