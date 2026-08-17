"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { ClientDetailWorkspace } from "@/features/clients/components/client-detail-workspace";
import { mapClientDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { useGetClientDetailQuery } from "@/lib/api/admin-details-api";

export function ClientDetailPageClient({ clientId }: { clientId: string }) {
  const { data, error, isError, isLoading, refetch } =
    useGetClientDetailQuery(clientId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Client detail"
        description="Loading live client account, finance, and relationship data."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading client detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Client detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <ClientDetailWorkspace client={mapClientDetailFromApi(data)} />;
}
