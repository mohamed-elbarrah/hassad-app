"use client";

import { ClientInfoPanel } from "@/components/client-detail/ClientInfoPanel";
import type { OperationalClientInfoView } from "@/features/clients/clientInfo.types";
import { clientWorkflowErrorMessage } from "@/lib/i18n";
import { mapOperationalClientInfoView } from "@/lib/mapOperationalClientInfoView";

interface OperationalClientInfoQuery {
  currentData?: OperationalClientInfoView;
  error?: unknown;
  isError: boolean;
  isFetching: boolean;
  originalArgs?: string;
  refetch: () => unknown;
}

export function OperationalClientInfoPanel({
  clientId,
  active,
  query,
}: {
  clientId?: string;
  active: boolean;
  query: OperationalClientInfoQuery;
}) {
  const view = query.currentData;
  const hasCurrentView = Boolean(clientId && view?.client.id === clientId);
  const error =
    query.isError && query.originalArgs === clientId ? query.error : undefined;

  return (
    <ClientInfoPanel
      clientId={clientId}
      client={
        hasCurrentView && view ? mapOperationalClientInfoView(view) : undefined
      }
      mode="operational"
      isLoading={
        !active ||
        (query.isFetching && !hasCurrentView) ||
        (!hasCurrentView && !error)
      }
      error={error}
      errorMessage={clientWorkflowErrorMessage}
      onRetry={query.refetch}
    />
  );
}
