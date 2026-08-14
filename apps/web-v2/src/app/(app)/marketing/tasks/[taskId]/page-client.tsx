"use client";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { PmTaskDetailWorkspace } from "@/features/pm-tasks/components/pm-task-detail-workspace";
import { mapTaskDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";
import { useGetMarketingTaskDetailQuery } from "@/lib/api/marketing-workspace-api";
export function MarketingTaskDetailPageClient({ taskId, currentUserId }: { taskId: string; currentUserId: string }) { const query = useGetMarketingTaskDetailQuery(taskId); if (query.isLoading && !query.data) return <PageScaffold title="Marketing task detail" description="Loading marketing task."><WorkspaceQueryState kind="loading" loadingTitle="Loading marketing task" /></PageScaffold>; if (query.isError || !query.data) return <PageScaffold title="Marketing task detail" description="Unable to load marketing task."><WorkspaceQueryState kind="error" error={query.error} onRetry={() => void query.refetch()} /></PageScaffold>; return <PmTaskDetailWorkspace task={mapTaskDetailFromApi(query.data)} currentUserId={currentUserId} mode="marketing" backHref="/marketing" />; }
