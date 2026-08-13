"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { ClientDetailWorkspace } from "@/features/clients/components/client-detail-workspace";
import { mapClientDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { useGetPmClientDetailQuery } from "@/lib/api/pm-clients-api";

export function PmClientDetailPageClient({ clientId, currentUserId }: { clientId: string; currentUserId: string }) {
  const { data, error, isError, isLoading, refetch } = useGetPmClientDetailQuery(clientId);

  if (isLoading && !data) {
    return (
      <PageScaffold title="Client detail" description="Loading PM client detail.">
        <WorkspaceQueryState kind="loading" loadingTitle="Loading client detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold title="Client detail" description="This workspace reads directly from the PM client API.">
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  const client = mapClientDetailFromApi(data);

  return <ClientDetailWorkspace backHref="/pm/clients" chatHrefBase="/pm/chat" client={client} />;
}
