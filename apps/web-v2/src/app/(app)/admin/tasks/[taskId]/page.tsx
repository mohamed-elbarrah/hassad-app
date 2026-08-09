import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TaskDetailWorkspace } from "@/features/tasks/components/task-detail-workspace";
import { getTaskDetailById } from "@/features/tasks/lib/task-detail";

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function generateMetadata({
  params,
}: TaskDetailPageProps): Promise<Metadata> {
  const { taskId } = await params;
  const task = getTaskDetailById(taskId);

  return {
    title: task ? `${task.title} | Hassad` : "Task Detail | Hassad",
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const task = getTaskDetailById(taskId);

  if (!task) {
    notFound();
  }

  return <TaskDetailWorkspace task={task} />;
}
