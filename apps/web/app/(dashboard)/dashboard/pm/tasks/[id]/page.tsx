"use client";

import { use } from "react";
import { TaskWorkspaceDetail } from "@/components/task-detail/TaskWorkspaceDetail";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <TaskWorkspaceDetail
      taskId={id}
      listHref="/dashboard/pm/tasks"
      listLabel="المهام"
      rootHref="/dashboard/pm"
      rootLabel="لوحة مدير المشروع"
      includeMarketingExtras
      pmOwned
    />
  );
}
