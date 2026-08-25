"use client";

import { use } from "react";
import { TaskWorkspaceDetail } from "@/components/task-detail/TaskWorkspaceDetail";

export default function MarketingTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);

  return (
    <TaskWorkspaceDetail
      taskId={taskId}
      listHref="/dashboard/marketing/tasks"
      listLabel="المهام التسويقية"
      rootHref="/dashboard/marketing"
      rootLabel="لوحة التسويق"
      includeMarketingExtras
      canManageMarketingExtras
      marketingOwned
    />
  );
}

