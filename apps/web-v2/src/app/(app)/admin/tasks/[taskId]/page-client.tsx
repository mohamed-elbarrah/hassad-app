"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapTaskDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { TaskDetailWorkspace } from "@/features/tasks/components/task-detail-workspace";
import { useGetTaskDetailQuery } from "@/lib/api/admin-details-api";

export function TaskDetailPageClient({ taskId }: { taskId: string }) {
  const { data, error, isError, isLoading, refetch } =
    useGetTaskDetailQuery(taskId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title="Task detail"
        description="Loading workflow, comments, files, and delivery context."
      >
        <WorkspaceQueryState kind="loading" loadingTitle="Loading task detail" />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title="Task detail"
        description="This workspace now reads directly from the backend."
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <TaskDetailWorkspace task={mapTaskDetailFromApi(data)} />;
}
