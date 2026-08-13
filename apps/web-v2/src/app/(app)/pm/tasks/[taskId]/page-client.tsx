"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapTaskDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { PmTaskDetailWorkspace } from "@/features/pm-tasks/components/pm-task-detail-workspace";
import { useGetPmTaskDetailQuery } from "@/lib/api/pm-tasks-api";

export function PmTaskDetailPageClient({ taskId, currentUserId }: { taskId: string; currentUserId: string }) {
  const { data, error, isError, isLoading, refetch } = useGetPmTaskDetailQuery(taskId);

  if (isLoading && !data) {
    return (
      <PageScaffold title="Task detail" description="Loading PM task detail.">
        <WorkspaceQueryState kind="loading" loadingTitle="Loading task detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold title="Task detail" description="This workspace reads directly from the PM task API.">
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <PmTaskDetailWorkspace task={mapTaskDetailFromApi(data)} currentUserId={currentUserId} />;
}
