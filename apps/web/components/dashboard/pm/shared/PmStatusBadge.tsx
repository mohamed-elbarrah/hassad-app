"use client";

import { Badge } from "@/components/ui/badge";
import { ProjectStatus, TaskStatus, DisputeStatus } from "@hassad/shared";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_KEY,
} from "@/lib/utils/project-status";
import { TASK_STATUS_LABELS } from "@/lib/utils/task-status";
import { DISPUTE_STATUS_AR } from "@hassad/shared";

type PmDomain = "project" | "task" | "dispute" | "revision";

const REVISION_STATUS_LABELS: Record<string, string> = {
  TODO: "معلّق",
  IN_PROGRESS: "جارٍ",
  IN_REVIEW: "قيد المراجعة",
  DONE: "منجز",
  REVISION: "يحتاج تعديل",
};

const UNKNOWN_STATUS_LABEL = "غير معروف";

function resolveLabel(domain: PmDomain, status: string): string {
  switch (domain) {
    case "project":
      return PROJECT_STATUS_LABELS[status as ProjectStatus] || UNKNOWN_STATUS_LABEL;
    case "task":
      return TASK_STATUS_LABELS[status as TaskStatus] || UNKNOWN_STATUS_LABEL;
    case "revision":
      return REVISION_STATUS_LABELS[status] || UNKNOWN_STATUS_LABEL;
    case "dispute":
      return DISPUTE_STATUS_AR[status as DisputeStatus] || UNKNOWN_STATUS_LABEL;
  }
}

function resolveVariant(domain: PmDomain, status: string) {
  const key =
    domain === "project"
      ? PROJECT_STATUS_BADGE_KEY[status as ProjectStatus]
      : status === TaskStatus.REVISION || status === "ESCALATED"
        ? "DANGER"
        : status === TaskStatus.DONE ||
            status === "RESOLVED" ||
            status === "CLOSED"
          ? "COMPLETED"
          : "PENDING";

  if (key === "DANGER") return "destructive" as const;
  if (key === "COMPLETED") return "default" as const;
  return "secondary" as const;
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
    <Badge variant={resolveVariant(domain, status)} className={className}>
      {resolveLabel(domain, status)}
    </Badge>
  );
}
