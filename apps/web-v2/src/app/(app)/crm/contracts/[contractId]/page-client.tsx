"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { ContractDetailWorkspace } from "@/features/crm-contracts/components/contract-detail-workspace";
import { mapContractDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { useGetCrmContractDetailQuery } from "@/lib/api/crm-contracts-api";

export function CrmContractDetailPageClient({
  contractId,
}: {
  contractId: string;
}) {
  const { data, error, isError, isLoading, refetch } = useGetCrmContractDetailQuery(contractId, {
    skip: !contractId,
  });

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
        description="This workspace now reads directly from the CRM API."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  const mapped = mapContractDetailFromApi(data);

  return (
    <ContractDetailWorkspace
      backHref="/crm/contracts"
      contract={{
        ...mapped,
        linkedRecords: mapped.linkedRecords.map((record) => ({
          ...record,
          href: record.href?.startsWith("/admin/clients/")
            ? record.href.replace("/admin/clients/", "/crm/clients/")
            : undefined,
        })),
      }}
    />
  );
}
