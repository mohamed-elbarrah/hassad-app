"use client";

import { ClientInfoPanel } from "@/components/client-detail/ClientInfoPanel";
import { useGetSalesClientInfoQuery } from "@/features/clients/clientsApi";
import { clientWorkflowErrorMessage } from "@/lib/i18n";
import { mapSalesClientInfo } from "@/lib/mapSalesClientInfo";

export function SalesClientInfoPanel({
  clientId,
  active,
}: {
  clientId?: string;
  active: boolean;
}) {
  const query = useGetSalesClientInfoQuery(clientId ?? "", {
    skip: !active || !clientId,
  });

  const client = query.currentData;
  const hasCurrentClient = Boolean(clientId && client?.id === clientId);
  const error =
    query.isError && query.originalArgs === clientId ? query.error : undefined;

  return (
    <ClientInfoPanel
      clientId={clientId}
      client={hasCurrentClient && client ? mapSalesClientInfo(client) : undefined}
      isLoading={
        !active ||
        (query.isFetching && !hasCurrentClient) ||
        (!hasCurrentClient && !error)
      }
      error={error}
      errorMessage={clientWorkflowErrorMessage}
      onRetry={query.refetch}
    />
  );
}
