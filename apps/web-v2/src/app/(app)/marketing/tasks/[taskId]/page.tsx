import type { Metadata } from "next";
import { requireServerSession } from "@/lib/auth/server-session";
import { MarketingTaskDetailPageClient } from "./page-client";
export const metadata: Metadata = { title: "Marketing Task Detail | Hassad" };
export default async function MarketingTaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) { const session = await requireServerSession(); const { taskId } = await params; return <MarketingTaskDetailPageClient taskId={taskId} currentUserId={session.id} />; }
