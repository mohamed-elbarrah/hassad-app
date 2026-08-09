"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapContractDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { ContractDetailWorkspace } from "@/features/crm-contracts/components/contract-detail-workspace";
import { useGetContractDetailQuery } from "@/lib/api/admin-details-api";

export function ContractDetailPageClient({
  contractId,
}: {
  contractId: string;
}) {
  const { data, error, isError, isLoading, refetch } =
    useGetContractDetailQuery(contractId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Contract detail"
        description="Loading contract lifecycle, billing, and delivery linkage."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading contract detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Contract detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <ContractDetailWorkspace contract={mapContractDetailFromApi(data)} />;
}
