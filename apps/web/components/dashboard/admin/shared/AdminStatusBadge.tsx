"use client";

import { Badge } from "@/components/ui/badge";
import { UNKNOWN_STATUS_LABEL } from "@/lib/i18n";
import {
  ProjectStatus,
  TaskStatus,
  DisputeStatus,
  PROJECT_STATUS_AR,
  TASK_STATUS_AR,
  DISPUTE_STATUS_AR,
  CONTRACT_STATUS_AR,
  CLIENT_STATUS_AR,
  REQUEST_STATUS_AR,
  PROPOSAL_STATUS_AR,
  INVOICE_STATUS_AR,
  PAYMENT_STATUS_AR,
  WORKLOAD_STATUS_AR,
  CAMPAIGN_STATUS_AR,
  USER_ROLE_AR,
  LEAD_STAGE_AR,
} from "@hassad/shared";

type AdminDomain =
  | "project"
  | "task"
  | "dispute"
  | "client"
  | "contract"
  | "lead"
  | "request"
  | "invoice"
  | "payment"
  | "user"
  | "team"
  | "campaign"
  | "proposal"
  | "revision"
  | "audit";

const REVISION_STATUS_LABELS: Record<string, string> = {
  TODO: "معلّق",
  IN_PROGRESS: "جارٍ",
  IN_REVIEW: "قيد المراجعة",
  DONE: "منجز",
  REVISION: "يحتاج تعديل",
};

function resolveVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const successStates = ["ACTIVE", "COMPLETED", "DONE", "SIGNED", "APPROVED", "PAID", "SUCCESS", "IN_PROGRESS"];
  const dangerStates = ["CANCELLED", "REJECTED", "EXPIRED", "OVERDUE", "STOPPED", "FAILED", "REFUNDED", "CANCELLED"];
  const warningStates = ["PENDING", "ON_HOLD", "NEEDS_REVISION", "REVISION", "PAUSED", "WARNING", "DANGER", "OVERLOADED", "SENT", "UNDER_REVIEW"];

  if (successStates.includes(status)) return "default";
  if (dangerStates.includes(status)) return "destructive";
  if (warningStates.includes(status)) return "secondary";
  return "outline";
}

function resolveBadgeKey(domain: AdminDomain, status: string): string {
  switch (domain) {
    case "project": {
      const map: Record<string, string> = {
        PLANNING: "PLANNING",
        ACTIVE: "ACTIVE",
        ON_HOLD: "ON_HOLD",
        PENDING_ACTIVATION: "PENDING",
        AWAITING_REVIEW: "PENDING",
        NEEDS_REVISION: "NEEDS_REVISION",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",
      };
      return map[status] || "PENDING";
    }
    case "task": {
      if (status === "DONE") return "COMPLETED";
      if (status === "IN_REVIEW") return "UNDER_REVIEW";
      if (status === "REVISION") return "REVISION";
      if (status === "IN_PROGRESS") return "IN_PROGRESS";
      return "PENDING";
    }
    case "revision": {
      const map: Record<string, string> = {
        TODO: "PENDING",
        IN_PROGRESS: "ACTIVE",
        IN_REVIEW: "UNDER_REVIEW",
        DONE: "COMPLETED",
        REVISION: "REVISION",
      };
      return map[status] || "PENDING";
    }
    case "dispute": {
      const map: Record<string, string> = {
        PENDING_APPROVAL: "PENDING",
        REJECTED: "CANCELLED",
        APPROVED: "ACTIVE",
        IN_PROGRESS: "IN_PROGRESS",
        PENDING_CLIENT: "PENDING",
        ESCALATED: "DANGER",
        RESOLVED: "COMPLETED",
        CLOSED: "COMPLETED",
      };
      return map[status] || "PENDING";
    }
    case "client": {
      const map: Record<string, string> = {
        LEAD: "PENDING",
        ACTIVE: "ACTIVE",
        STOPPED: "STOPPED",
      };
      return map[status] || "PENDING";
    }
    case "contract":
      return status;
    case "lead": {
      const map: Record<string, string> = {
        NEW: "NEW",
        CONTACTED: "ACTIVE",
        QUALIFIED: "ACTIVE",
        PROPOSAL: "UNDER_REVIEW",
        NEGOTIATION: "UNDER_REVIEW",
        CLOSED_WON: "COMPLETED",
        CLOSED_LOST: "CANCELLED",
      };
      return map[status] || "PENDING";
    }
    case "request": {
      const map: Record<string, string> = {
        NEW: "NEW",
        PENDING_QUALIFICATION: "PENDING",
        QUALIFIED: "ACTIVE",
        PROPOSAL_SENT: "SENT",
        APPROVED: "APPROVED",
        REJECTED: "REJECTED",
        CANCELLED: "CANCELLED",
      };
      return map[status] || "PENDING";
    }
    case "invoice":
      return status;
    case "payment":
      return status;
    case "team": {
      const map: Record<string, string> = {
        AVAILABLE: "COMPLETED",
        BUSY: "ACTIVE",
        OVERLOADED: "DANGER",
      };
      return map[status] || "PENDING";
    }
    case "campaign": {
      const map: Record<string, string> = {
        PLANNING: "DRAFT",
        ACTIVE: "ACTIVE",
        PAUSED: "PAUSED",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",
      };
      return map[status] || "PENDING";
    }
    case "audit": {
      const map: Record<string, string> = {
        CREATE: "COMPLETED",
        UPDATE: "ACTIVE",
        DELETE: "CANCELLED",
        ADMIN_INTERVENE: "DANGER",
        IMPERSONATE: "UNDER_REVIEW",
      };
      return map[status] || "PENDING";
    }
    case "proposal":
      return status;
    default:
      return "PENDING";
  }
}

function resolveLabel(domain: AdminDomain, status: string): string {
  switch (domain) {
    case "project":
      return PROJECT_STATUS_AR[status as ProjectStatus] || UNKNOWN_STATUS_LABEL;
    case "task":
      return TASK_STATUS_AR[status as TaskStatus] || UNKNOWN_STATUS_LABEL;
    case "revision":
      return REVISION_STATUS_LABELS[status] || UNKNOWN_STATUS_LABEL;
    case "dispute":
      return DISPUTE_STATUS_AR[status as DisputeStatus] || UNKNOWN_STATUS_LABEL;
    case "client":
      return CLIENT_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "contract":
      return CONTRACT_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "lead":
      return LEAD_STAGE_AR[status] || UNKNOWN_STATUS_LABEL;
    case "request":
      return REQUEST_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "invoice":
      return INVOICE_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "payment":
      return PAYMENT_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "user":
      return USER_ROLE_AR[status] || UNKNOWN_STATUS_LABEL;
    case "team":
      return WORKLOAD_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "campaign":
      return CAMPAIGN_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "proposal":
      return PROPOSAL_STATUS_AR[status] || UNKNOWN_STATUS_LABEL;
    case "audit":
      return UNKNOWN_STATUS_LABEL;
    default:
      return UNKNOWN_STATUS_LABEL;
  }
}

interface AdminStatusBadgeProps {
  domain: AdminDomain;
  status: string;
  className?: string;
}

export function AdminStatusBadge({
  domain,
  status,
  className,
}: AdminStatusBadgeProps) {
  const badgeKey = resolveBadgeKey(domain, status);
  const label = resolveLabel(domain, status);

  return (
    <Badge variant={resolveVariant(badgeKey)} className={className}>
      {label}
    </Badge>
  );
}
