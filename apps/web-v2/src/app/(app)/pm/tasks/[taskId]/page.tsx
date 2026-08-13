import type { Metadata } from "next";

import { requireServerSession } from "@/lib/auth/server-session";
import { PmTaskDetailPageClient } from "./page-client";

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PM Task Detail | Hassad",
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await requireServerSession();
  const { taskId } = await params;
  return <PmTaskDetailPageClient taskId={taskId} currentUserId={session.id} />;
}
