import type { Metadata } from "next";
import { requireServerSession } from "@/lib/auth/server-session";
import { MarketingStrategyDetailPageClient } from "./page-client";
export const metadata: Metadata = { title: "Marketing Strategy Detail | Hassad" };
export default async function StrategyDetailPage({ params }: { params: Promise<{ strategyId: string }> }) { await requireServerSession(); const { strategyId } = await params; return <MarketingStrategyDetailPageClient strategyId={strategyId} />; }
