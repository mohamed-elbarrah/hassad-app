"use client";

import Link from "next/link";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { mapPmDisputeWorkspace } from "@/features/pm-disputes/lib/pm-dispute-mappers";
import { PmDisputeDetailWorkspace } from "@/features/pm-disputes/components/pm-dispute-detail-workspace";
import { useGetPmDisputeWorkspaceQuery } from "@/lib/api/pm-disputes-api";

export function PmDisputeDetailPageClient({ disputeId }: { disputeId: string }) {
  const { data, error, isError, isLoading, refetch } = useGetPmDisputeWorkspaceQuery(disputeId);

  if (isLoading && !data) {
    return (
      <PageScaffold title="Dispute detail" description="Loading the PM dispute workspace.">
        <WorkspaceQueryState kind="loading" loadingTitle="Loading dispute detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    const status = (error as { status?: number } | undefined)?.status;

    if (status === 404) {
      return (
        <PageScaffold
          title="Dispute detail"
          description="The dispute is no longer available in your PM queue."
          actions={
            <Button type="button" variant="outline" nativeButton={false} render={<Link href="/pm/disputes" />}>
              Back to disputes
            </Button>
          }
        >
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Dispute not found</EmptyTitle>
              <EmptyDescription>
                The dispute may have been archived, reassigned, or removed from your current PM workspace.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </PageScaffold>
      );
    }

    return (
      <PageScaffold title="Dispute detail" description="This workspace reads directly from the PM dispute API.">
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <PmDisputeDetailWorkspace record={mapPmDisputeWorkspace(data)} />;
}
