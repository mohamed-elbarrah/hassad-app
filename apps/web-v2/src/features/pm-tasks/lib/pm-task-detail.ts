import type { TaskDetailRecord } from "@/features/tasks/lib/task-detail";
import { mapTaskDetailFromApi } from "@/features/admin-details/lib/detail-workspace-mappers";

export function mapPmTaskDetailFromApi(task: unknown): TaskDetailRecord {
  return mapTaskDetailFromApi(task);
}
