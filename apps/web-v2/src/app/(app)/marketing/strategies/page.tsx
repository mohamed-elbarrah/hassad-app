import type { Metadata } from "next";
import { MarketingStrategiesWorkspace } from "@/features/marketing/components/marketing-strategies-workspace";
export const metadata: Metadata = { title: "Marketing Strategies | Hassad" };
export default function StrategiesPage() { return <MarketingStrategiesWorkspace />; }
