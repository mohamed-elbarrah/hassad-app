import type { StatusType } from "@/components/design-system/StatusBadge";
import type { TaskStatus } from "@hassad/shared";

export type UIStatus = StatusType;

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

export function mapProjectStatusToUI(status: string): UIStatus {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "ON_HOLD":
      return "on-hold";
    case "COMPLETED":
      return "completed";
    case "PLANNING":
      return "planning";
    case "CANCELLED":
      return "cancelled";
    case "AWAITING_REVIEW":
      return "awaiting-review";
    case "NEEDS_REVISION":
      return "needs-revision";
    default:
      return "planning";
  }
}

export function mapContractStatusToUI(status: string): UIStatus {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "SENT":
      return "awaiting-review";
    case "SIGNED":
      return "completed";
    case "ACTIVE":
      return "active";
    case "EXPIRED":
      return "overdue";
    case "CANCELLED":
      return "cancelled";
    default:
      return "draft";
  }
}

export function mapProposalStatusToUI(status: string): UIStatus {
  switch (status) {
    case "SENT":
      return "awaiting-review";
    case "APPROVED":
      return "completed";
    case "REVISION_REQUESTED":
      return "needs-revision";
    case "REJECTED":
      return "cancelled";
    case "DRAFT":
      return "draft";
    default:
      return "draft";
  }
}

export function mapFinanceStatusToUI(status: string): UIStatus {
  switch (status) {
    case "PAID":
      return "completed";
    case "PARTIAL":
      return "pending";
    case "DUE":
      return "revision";
    case "SENT":
      return "active";
    case "LATE":
      return "overdue";
    case "PENDING":
      return "pending";
    case "CANCELLED":
      return "cancelled";
    case "UNPAID":
      return "unpaid";
    default:
      return "pending";
  }
}

export function mapCampaignStatusToUI(status: string): UIStatus {
  switch (status) {
    case "PLANNING":
      return "planning";
    case "ACTIVE":
      return "active";
    case "PAUSED":
      return "on-hold";
    case "STOPPED":
      return "cancelled";
    case "COMPLETED":
      return "completed";
    default:
      return "planning";
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
