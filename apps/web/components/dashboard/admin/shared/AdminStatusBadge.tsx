"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
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

const CLIENT_STATUS_BADGE: Record<string, string> = {
  LEAD: "PENDING",
  ACTIVE: "ACTIVE",
  STOPPED: "CANCELLED",
};

const CONTRACT_STATUS_BADGE: Record<string, string> = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  SIGNED: "SIGNED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const LEAD_STAGE_BADGE: Record<string, string> = {
  NEW: "NEW",
  CONTACTED: "ACTIVE",
  QUALIFIED: "ACTIVE",
  PROPOSAL: "WARNING",
  NEGOTIATION: "WARNING",
  CLOSED_WON: "COMPLETED",
  CLOSED_LOST: "CANCELLED",
};

const REQUEST_STATUS_BADGE: Record<string, string> = {
  NEW: "NEW",
  PENDING_QUALIFICATION: "PENDING",
  QUALIFIED: "ACTIVE",
  PROPOSAL_SENT: "SENT",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

const INVOICE_STATUS_BADGE: Record<string, string> = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  PARTIAL: "PARTIAL",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
  REFUNDED: "CANCELLED",
};

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  PENDING: "PENDING",
  SUCCESS: "COMPLETED",
  FAILED: "CANCELLED",
  REFUNDED: "CANCELLED",
};

const WORKLOAD_STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "COMPLETED",
  BUSY: "ACTIVE",
  OVERLOADED: "DANGER",
};

const CAMPAIGN_STATUS_BADGE: Record<string, string> = {
  PLANNING: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const AUDIT_ACTION_BADGE: Record<string, string> = {
  CREATE: "COMPLETED",
  UPDATE: "ACTIVE",
  DELETE: "CANCELLED",
  ADMIN_INTERVENE: "DANGER",
  IMPERSONATE: "WARNING",
};

const PROPOSAL_STATUS_BADGE: Record<string, string> = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  UNDER_REVIEW: "WARNING",
  ACCEPTED: "COMPLETED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
};

function resolveBadgeKey(domain: AdminDomain, status: string): string {
  switch (domain) {
    case "project": {
      const map: Record<string, string> = {
        PLANNING: "DRAFT",
        ACTIVE: "ACTIVE",
        ON_HOLD: "STOPPED",
        PENDING_ACTIVATION: "PENDING",
        AWAITING_REVIEW: "PENDING",
        NEEDS_REVISION: "REJECTED",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",
      };
      return map[status] || "PENDING";
    }
    case "task": {
      if (status === "DONE") return "COMPLETED";
      if (status === "IN_REVIEW") return "WARNING";
      if (status === "REVISION") return "DANGER";
      if (status === "IN_PROGRESS") return "ACTIVE";
      return "PENDING";
    }
    case "revision":
      return REVISION_STATUS_BADGE[status] || "PENDING";
    case "dispute":
      return DISPUTE_STATUS_BADGE[status] || "PENDING";
    case "client":
      return CLIENT_STATUS_BADGE[status] || "PENDING";
    case "contract":
      return CONTRACT_STATUS_BADGE[status] || "PENDING";
    case "lead":
      return LEAD_STAGE_BADGE[status] || "PENDING";
    case "request":
      return REQUEST_STATUS_BADGE[status] || "PENDING";
    case "invoice":
      return INVOICE_STATUS_BADGE[status] || "PENDING";
    case "payment":
      return PAYMENT_STATUS_BADGE[status] || "PENDING";
    case "team":
      return WORKLOAD_STATUS_BADGE[status] || "PENDING";
    case "campaign":
      return CAMPAIGN_STATUS_BADGE[status] || "PENDING";
    case "proposal":
      return PROPOSAL_STATUS_BADGE[status] || "PENDING";
    case "audit":
      return AUDIT_ACTION_BADGE[status] || "PENDING";
    default:
      return "PENDING";
  }
}

function resolveLabel(domain: AdminDomain, status: string): string {
  switch (domain) {
    case "project":
      return PROJECT_STATUS_AR[status as ProjectStatus] || status;
    case "task":
      return TASK_STATUS_AR[status as TaskStatus] || status;
    case "revision":
      return REVISION_STATUS_LABELS[status] || status;
    case "dispute":
      return DISPUTE_STATUS_AR[status as DisputeStatus] || status;
    case "client":
      return CLIENT_STATUS_AR[status] || status;
    case "contract":
      return CONTRACT_STATUS_AR[status] || status;
    case "lead":
      return LEAD_STAGE_AR[status] || status;
    case "request":
      return REQUEST_STATUS_AR[status] || status;
    case "invoice":
      return INVOICE_STATUS_AR[status] || status;
    case "payment":
      return PAYMENT_STATUS_AR[status] || status;
    case "user":
      return USER_ROLE_AR[status] || status;
    case "team":
      return WORKLOAD_STATUS_AR[status] || status;
    case "campaign":
      return CAMPAIGN_STATUS_AR[status] || status;
    case "proposal":
      return PROPOSAL_STATUS_AR[status] || status;
    case "audit":
      return status;
    default:
      return status;
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
  return (
    <StatusBadge
      status={resolveBadgeKey(domain, status)}
      label={resolveLabel(domain, status)}
      className={className}
    />
  );
}
