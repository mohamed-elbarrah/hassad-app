"use client";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { ExecutionClientDetailWorkspace } from "@/features/clients/components/execution-client-detail-workspace";
import { useGetTeamClientViewQuery } from "@/lib/api/execution-clients-api";
export function TeamClientPageClient({ clientId }: { clientId: string }) { const query = useGetTeamClientViewQuery(clientId); if (query.isLoading && !query.data) return <PageScaffold title="Client detail" description="Loading client context."><WorkspaceQueryState kind="loading" loadingTitle="Loading client" /></PageScaffold>; if (query.isError || !query.data) return <PageScaffold title="Client detail" description="Unable to load client context."><WorkspaceQueryState kind="error" error={query.error} onRetry={() => void query.refetch()} /></PageScaffold>; return <ExecutionClientDetailWorkspace view={query.data} mode="team" />; }
