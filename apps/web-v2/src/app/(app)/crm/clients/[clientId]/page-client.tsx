"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { ClientDetailWorkspace } from "@/features/clients/components/client-detail-workspace";
import { mapClientDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { useGetCrmClientDetailQuery } from "@/lib/api/crm-clients-api";

export function CrmClientDetailPageClient({ clientId }: { clientId: string }) {
  const { data, error, isError, isLoading, refetch } = useGetCrmClientDetailQuery(clientId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Client detail"
        description="Loading client account, finance, and relationship data."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading client detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Client detail"
        description="This workspace now reads directly from the CRM API."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  const client = mapClientDetailFromApi(data);

  return (
    <ClientDetailWorkspace
      backHref="/crm/clients"
      chatHrefBase="/crm/chat"
      client={{
        ...client,
        linkedRecords: client.linkedRecords?.map((record) => ({
          ...record,
          href: record.href?.startsWith("/admin/")
            ? record.href.replace("/admin/", "/crm/")
            : record.href,
        })) ?? [],
      }}
    />
  );
}
