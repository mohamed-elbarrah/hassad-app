import type { Metadata } from "next";
import { TaskDetailPageClient } from "./page-client";

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Task Detail | Hassad",
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  return <TaskDetailPageClient taskId={taskId} />;
}
