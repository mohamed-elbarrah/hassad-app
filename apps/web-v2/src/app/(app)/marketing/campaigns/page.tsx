import type { Metadata } from "next";
import { MarketingCampaignsWorkspace } from "@/features/marketing/components/marketing-campaigns-workspace";
export const metadata: Metadata = { title: "Marketing Campaigns | Hassad" };
export default function CampaignsPage() { return <MarketingCampaignsWorkspace />; }
