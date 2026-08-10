"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapProposalDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { ProposalDetailWorkspace } from "@/features/crm-proposals/components/proposal-detail-workspace";
import { useGetCrmProposalDetailQuery } from "@/lib/api/crm-proposals-api";

export function CrmProposalDetailPageClient({ proposalId }: { proposalId: string }) {
  const { data, error, isError, isLoading, refetch } = useGetCrmProposalDetailQuery(proposalId);

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
        description="This workspace now reads directly from the CRM API."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  const proposal = mapProposalDetailFromApi(data);

  return (
    <ProposalDetailWorkspace
      backHref="/crm/proposals"
      proposal={{
        ...proposal,
        linkedRecords: proposal.linkedRecords.map((record) => ({
          ...record,
          href: record.href?.startsWith("/admin/")
            ? record.href.replace("/admin/", "/crm/")
            : record.href,
        })),
      }}
    />
  );
}
