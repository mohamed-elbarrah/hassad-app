"use client";

import Link from "next/link";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { Button } from "@/components/ui/button";
import { mapProjectDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { ProjectDetailWorkspace } from "@/features/projects/components/project-detail-workspace";
import { useGetPmProjectDetailQuery } from "@/lib/api/pm-projects-api";

export function PmProjectDetailPageClient({ projectId }: { projectId: string }) {
  const { data, error, isError, isLoading, refetch } = useGetPmProjectDetailQuery(projectId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="PM Project detail"
        description="Loading project delivery, periods, and tasks."
        actions={
          <Button type="button" variant="outline" nativeButton={false} render={<Link href="/pm" />}>
            Back
          </Button>
        }
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading project detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="PM Project detail"
        description="This workspace reads directly from the PM API."
        actions={
          <Button type="button" variant="outline" nativeButton={false} render={<Link href="/pm" />}>
            Back
          </Button>
        }
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <ProjectDetailWorkspace project={mapProjectDetailFromApi(data)} />;
}
