"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapTaskDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { PmTaskDetailWorkspace } from "@/features/pm-tasks/components/pm-task-detail-workspace";
import { useGetTeamTaskDetailQuery } from "@/lib/api/team-tasks-api";

export function TeamTaskDetailPageClient({ taskId, currentUserId }: { taskId: string; currentUserId: string }) {
  const { data, error, isError, isLoading, refetch } = useGetTeamTaskDetailQuery(taskId);

  if (isLoading && !data) {
    return <PageScaffold title="Task detail" description="Loading task detail."><WorkspaceQueryState kind="loading" loadingTitle="Loading task detail" /></PageScaffold>;
  }

  if ((isError || !data) && !data) {
    return <PageScaffold title="Task detail" description="This workspace reads your assigned task from the Team API."><WorkspaceQueryState kind="error" error={error} onRetry={() => void refetch()} /></PageScaffold>;
  }

  return <PmTaskDetailWorkspace task={mapTaskDetailFromApi(data)} currentUserId={currentUserId} mode="team" backHref="/team" />;
}
