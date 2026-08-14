import type { Metadata } from "next";
import { MarketingOverviewWorkspace } from "@/features/marketing/components/marketing-overview-workspace";

export const metadata: Metadata = { title: "Marketing Work | Hassad" };
export default function MarketingOverviewPage() { return <MarketingOverviewWorkspace />; }
