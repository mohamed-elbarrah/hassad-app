"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapDisputeDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { DisputeDetailWorkspace } from "@/features/disputes/components/dispute-detail-workspace";
import { useGetDisputeDetailQuery } from "@/lib/api/admin-details-api";

export function DisputeDetailPageClient({
  disputeId,
}: {
  disputeId: string;
}) {
  const { data, error, isError, isLoading, refetch } =
    useGetDisputeDetailQuery(disputeId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Dispute detail"
        description="Loading dispute approval state, messages, and evidence."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading dispute detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Dispute detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <DisputeDetailWorkspace dispute={mapDisputeDetailFromApi(data)} />;
}
