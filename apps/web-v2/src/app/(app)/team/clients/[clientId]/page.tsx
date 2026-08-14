import type { Metadata } from "next";
import { requireServerSession } from "@/lib/auth/server-session";
import { TeamClientPageClient } from "./page-client";
export const metadata: Metadata = { title: "Client Detail | Hassad" };
export default async function TeamClientPage({ params }: { params: Promise<{ clientId: string }> }) { await requireServerSession(); const { clientId } = await params; return <TeamClientPageClient clientId={clientId} />; }
