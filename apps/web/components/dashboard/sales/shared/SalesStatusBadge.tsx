"use client";

import { StatusBadge } from "@/components/design-system/StatusBadge";
import {
  mapContractStatusToUI,
  mapProposalStatusToUI,
  mapProjectStatusToUI,
  mapFinanceStatusToUI,
} from "@/lib/utils/statusMapping";

/**
 * Domains that the sales dashboard uses for status display.
 */
export type SalesDomain =
  | "contract"
  | "proposal"
  | "request"
  | "client"
  | "project"
  | "invoice";

interface SalesStatusBadgeProps {
  domain: SalesDomain;
  status: string;
  label?: string;
}

/**
 * Maps every sales domain + status to the correct `StatusBadge`.
 *
 * This is the **single source of truth** for status display in the
 * sales dashboard. Every page that previously defined its own
 * `STATUS_META` / `STATUS_TONE` / `STATUS_LABELS` map should use
 * this component instead.
 *
 * Supported domains:
 * - `contract`  → uses `mapContractStatusToUI`
 * - `proposal`  → uses `mapProposalStatusToUI`
 * - `project`   → uses `mapProjectStatusToUI`
 * - `invoice`   → uses `mapFinanceStatusToUI`
 * - `request`   → custom mapping (not in shared statusMapping yet)
 * - `client`    → custom mapping
 */
export function SalesStatusBadge({
  domain,
  status,
  label,
}: SalesStatusBadgeProps) {
  const uiStatus = resolveUIStatus(domain, status);
  return <StatusBadge status={uiStatus} label={label} />;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

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

/**
 * Request status → UI status mapping.
 * These are the pipeline stages visible in the sales Kanban.
 */
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

/**
 * Client status → UI status mapping.
 */
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
