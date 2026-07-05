"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ProjectStatus, TaskStatus, DisputeStatus } from "@hassad/shared";
import {
  PROJECT_STATUS_BADGE_KEY,
  PROJECT_STATUS_LABELS,
} from "@/lib/utils/project-status";
import { TASK_STATUS_LABELS } from "@/lib/utils/task-status";
import { DISPUTE_STATUS_AR } from "@hassad/shared";

type PmDomain = "project" | "task" | "dispute" | "revision";

const REVISION_STATUS_BADGE: Record<string, string> = {
  TODO: "PENDING",
  IN_PROGRESS: "ACTIVE",
  IN_REVIEW: "WARNING",
  DONE: "COMPLETED",
  REVISION: "DANGER",
};

const REVISION_STATUS_LABELS: Record<string, string> = {
  TODO: "معلّق",
  IN_PROGRESS: "جارٍ",
  IN_REVIEW: "قيد المراجعة",
  DONE: "منجز",
  REVISION: "يحتاج تعديل",
};

const DISPUTE_STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: "PENDING",
  REJECTED: "CANCELLED",
  APPROVED: "ACTIVE",
  IN_PROGRESS: "ACTIVE",
  PENDING_CLIENT: "WARNING",
  ESCALATED: "DANGER",
  RESOLVED: "COMPLETED",
  CLOSED: "COMPLETED",
};

function resolveBadgeKey(domain: PmDomain, status: string): string {
  switch (domain) {
    case "project":
      return PROJECT_STATUS_BADGE_KEY[status as ProjectStatus] || "PENDING";
    case "task":
      if (status === TaskStatus.DONE) return "COMPLETED";
      if (status === TaskStatus.IN_REVIEW) return "WARNING";
      if (status === TaskStatus.REVISION) return "DANGER";
      if (status === TaskStatus.IN_PROGRESS) return "ACTIVE";
      return "PENDING";
    case "revision":
      return REVISION_STATUS_BADGE[status] || "PENDING";
    case "dispute":
      return DISPUTE_STATUS_BADGE[status] || "PENDING";
    default:
      return "PENDING";
  }
}

function resolveLabel(domain: PmDomain, status: string): string {
  switch (domain) {
    case "project":
      return PROJECT_STATUS_LABELS[status as ProjectStatus] || status;
    case "task":
      return TASK_STATUS_LABELS[status as TaskStatus] || status;
    case "revision":
      return REVISION_STATUS_LABELS[status] || status;
    case "dispute":
      return DISPUTE_STATUS_AR[status as DisputeStatus] || status;
    default:
      return status;
  }
}

interface PmStatusBadgeProps {
  domain: PmDomain;
  status: string;
  className?: string;
}

export function PmStatusBadge({
  domain,
  status,
  className,
}: PmStatusBadgeProps) {
  return (
    <StatusBadge
      status={resolveBadgeKey(domain, status)}
      label={resolveLabel(domain, status)}
      className={className}
    />
  );
}
