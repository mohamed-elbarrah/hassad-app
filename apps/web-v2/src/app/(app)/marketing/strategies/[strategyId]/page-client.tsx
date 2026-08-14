"use client";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { MarketingStrategyDetailWorkspace } from "@/features/marketing/components/marketing-strategy-detail-workspace";
import { useGetMarketingStrategyQuery } from "@/lib/api/marketing-workspace-api";
export function MarketingStrategyDetailPageClient({ strategyId }: { strategyId: string }) { const query = useGetMarketingStrategyQuery(strategyId); if (query.isLoading && !query.data) return <PageScaffold title="Strategy detail" description="Loading strategy."><WorkspaceQueryState kind="loading" loadingTitle="Loading strategy" /></PageScaffold>; if (query.isError || !query.data) return <PageScaffold title="Strategy detail" description="Unable to load strategy."><WorkspaceQueryState kind="error" error={query.error} onRetry={() => void query.refetch()} /></PageScaffold>; return <MarketingStrategyDetailWorkspace strategy={query.data} />; }
