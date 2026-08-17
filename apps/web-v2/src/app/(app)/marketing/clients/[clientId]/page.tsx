import type { Metadata } from "next";
import { requireServerSession } from "@/lib/auth/server-session";
import { MarketingClientPageClient } from "./page-client";
export const metadata: Metadata = { title: "Client Detail | Hassad" };
export default async function MarketingClientPage({ params }: { params: Promise<{ clientId: string }> }) { await requireServerSession(); const { clientId } = await params; return <MarketingClientPageClient clientId={clientId} />; }
