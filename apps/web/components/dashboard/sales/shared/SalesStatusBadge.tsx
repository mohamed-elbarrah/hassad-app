"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  mapContractStatusToUI,
  mapFinanceStatusToUI,
  mapProjectStatusToUI,
  mapProposalStatusToUI,
} from "@/lib/utils/statusMapping";

export type SalesDomain =
  | "contract"
  | "proposal"
  | "request"
  | "client"
  | "project"
  | "invoice";

type SalesStatusTone =
  | "neutral"
  | "warning"
  | "info"
  | "review"
  | "success"
  | "danger";

interface SalesStatusBadgeProps {
  domain: SalesDomain;
  status: string;
  label?: string;
}

const SALES_STATUS_STYLES: Record<SalesStatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  warning: "border-warning/20 bg-warning/15 text-warning",
  info: "border-info/20 bg-info/15 text-info",
  review: "border-primary/15 bg-primary/10 text-primary",
  success: "border-success/20 bg-success/15 text-success",
  danger: "border-destructive/20 bg-destructive/15 text-destructive",
};

export function SalesStatusBadge({
  domain,
  status,
  label,
}: SalesStatusBadgeProps) {
  const uiStatus = resolveUIStatus(domain, status);
  const meta = resolveStatusMeta(uiStatus);

  return (
    <Badge className={cn("font-medium", SALES_STATUS_STYLES[meta.tone])}>
      {label ?? meta.label}
    </Badge>
  );
}

function resolveUIStatus(domain: SalesDomain, status: string) {
  switch (domain) {
    case "contract":
      return mapContractStatusToUI(status);
    case "proposal":
      return mapProposalStatusToUI(status);
    case "project":
      return mapProjectStatusToUI(status);
    case "invoice":
      return mapFinanceStatusToUI(status);
    case "request":
      return mapRequestStatusToUI(status);
    case "client":
      return mapClientStatusToUI(status);
    default:
      return "draft";
  }
}

function resolveStatusMeta(status: string): {
  tone: SalesStatusTone;
  label: string;
} {
  switch (status) {
    case "pending":
      return { tone: "warning", label: "معلق" };
    case "in-progress":
      return { tone: "info", label: "قيد التنفيذ" };
    case "awaiting-review":
      return { tone: "review", label: "بانتظار المراجعة" };
    case "active":
      return { tone: "success", label: "نشط" };
    case "completed":
      return { tone: "success", label: "مكتمل" };
    case "cancelled":
      return { tone: "danger", label: "ملغي" };
    case "draft":
    default:
      return { tone: "neutral", label: "مسودة" };
  }
}

function mapRequestStatusToUI(status: string) {
  switch (status) {
    case "SUBMITTED":
    case "QUALIFYING":
      return "pending";
    case "PROPOSAL_IN_PROGRESS":
      return "in-progress";
    case "PROPOSAL_SENT":
    case "NEGOTIATION":
    case "CONTRACT_PREPARATION":
      return "awaiting-review";
    case "CONTRACT_SENT":
      return "active";
    case "SIGNED":
    case "PROJECT_CREATED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "draft";
  }
}

function mapClientStatusToUI(status: string) {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "STOPPED":
      return "cancelled";
    case "LEAD":
      return "pending";
    default:
      return "draft";
  }
}
