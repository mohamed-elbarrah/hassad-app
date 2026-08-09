"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapProposalDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { ProposalDetailWorkspace } from "@/features/crm-proposals/components/proposal-detail-workspace";
import { useGetProposalDetailQuery } from "@/lib/api/admin-details-api";

export function ProposalDetailPageClient({
  proposalId,
}: {
  proposalId: string;
}) {
  const { data, error, isError, isLoading, refetch } =
    useGetProposalDetailQuery(proposalId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Proposal detail"
        description="Loading commercial scope, pricing, and proposal status."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading proposal detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Proposal detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <ProposalDetailWorkspace proposal={mapProposalDetailFromApi(data)} />;
}
