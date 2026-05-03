import type { TaskStatus } from "@hassad/shared";

export type UIStatus = "completed" | "in-progress" | "not-started" | "pending" | "revision";

export function mapTaskStatusToUI(status: TaskStatus | string): UIStatus {
  switch (status) {
    case "DONE":
      return "completed";
    case "IN_PROGRESS":
    case "IN_REVIEW":
      return "in-progress";
    case "TODO":
      return "not-started";
    case "REVISION":
      return "revision";
    default:
      return "not-started";
  }
}

export function getStatusLabel(status: TaskStatus | string): string {
  switch (status) {
    case "DONE":
      return "مكتمل";
    case "IN_PROGRESS":
      return "جاري العمل";
    case "IN_REVIEW":
      return "قيد المراجعة";
    case "TODO":
      return "لم يبدأ";
    case "REVISION":
      return "تعديل مطلوب";
    default:
      return status;
  }
}