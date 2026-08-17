"use client";
import { PageScaffold } from "@/components/patterns/page-scaffold";
import { WorkspaceQueryState } from "@/components/patterns/workspace-query-state";
import { MarketingCampaignDetailWorkspace } from "@/features/marketing/components/marketing-campaign-detail-workspace";
import { useGetMarketingCampaignQuery } from "@/lib/api/marketing-workspace-api";
export function MarketingCampaignDetailPageClient({ campaignId }: { campaignId: string }) { const query = useGetMarketingCampaignQuery(campaignId); if (query.isLoading && !query.data) return <PageScaffold title="Campaign detail" description="Loading campaign."><WorkspaceQueryState kind="loading" loadingTitle="Loading campaign" /></PageScaffold>; if (query.isError || !query.data) return <PageScaffold title="Campaign detail" description="Unable to load campaign."><WorkspaceQueryState kind="error" error={query.error} onRetry={() => void query.refetch()} /></PageScaffold>; return <MarketingCampaignDetailWorkspace campaign={query.data} />; }
