import type { Metadata } from "next";
import { requireServerSession } from "@/lib/auth/server-session";
import { MarketingCampaignDetailPageClient } from "./page-client";
export const metadata: Metadata = { title: "Campaign Detail | Hassad" };
export default async function CampaignDetailPage({ params }: { params: Promise<{ campaignId: string }> }) { await requireServerSession(); const { campaignId } = await params; return <MarketingCampaignDetailPageClient campaignId={campaignId} />; }
