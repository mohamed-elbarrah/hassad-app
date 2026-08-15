"use client";

import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { mapTaskDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { TaskDetailWorkspace } from "@/features/tasks/components/task-detail-workspace";
import { useGetTaskDetailQuery } from "@/lib/api/admin-details-api";
import { useTranslations } from "@/lib/i18n";

export function TaskDetailPageClient({ taskId }: { taskId: string }) {
  const { t } = useTranslations();
  const { data, error, isError, isLoading, refetch } =
    useGetTaskDetailQuery(taskId);

  if (isLoading && !data) {
    return (
      <PageScaffold
        title={t("taskDetail")}
        description={t("taskDetailLoadingDescription")}
      >
        <WorkspaceQueryState kind="loading" loadingTitle={t("taskDetailLoading")} />
      </PageScaffold>
    );
  }

  if ((isError || !data) && !data) {
    return (
      <PageScaffold
        title={t("taskDetail")}
        description={t("projectDetailErrorDescription")}
      >
        <WorkspaceQueryState kind="error" error={error} onRetry={refetch} />
      </PageScaffold>
    );
  }

  return <TaskDetailWorkspace task={mapTaskDetailFromApi(data)} />;
}
