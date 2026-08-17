import type { Metadata } from "next";

import { requireServerSession } from "@/lib/auth/server-session";
import { TeamTaskDetailPageClient } from "./page-client";

type TeamTaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
};

export const metadata: Metadata = {
  title: "Team Task Detail | Hassad",
};

export default async function TeamTaskDetailPage({ params }: TeamTaskDetailPageProps) {
  const session = await requireServerSession();
  const { taskId } = await params;
  return <TeamTaskDetailPageClient taskId={taskId} currentUserId={session.id} />;
}
