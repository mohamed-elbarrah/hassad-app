"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapProjectDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { ProjectDetailWorkspace } from "@/features/projects/components/project-detail-workspace";
import { useGetProjectDetailQuery } from "@/lib/api/admin-details-api";

export function ProjectDetailPageClient({ projectId }: { projectId: string }) {
  const { data, error, isError, isLoading, refetch } =
    useGetProjectDetailQuery(projectId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Project detail"
        description="Loading live project delivery, period, finance, and dispute data."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading project detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Project detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <ProjectDetailWorkspace project={mapProjectDetailFromApi(data)} />;
}
