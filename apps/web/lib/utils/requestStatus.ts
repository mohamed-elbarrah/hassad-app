// apps/web/lib/utils/requestStatus.ts
//
// Single source of truth for portal request (order) status mapping.
//
// Owns:
//   - status → UI badge mapping (consistent with other mappers in
//     ./statusMapping)
//   - status → Arabic label (the backend hardcodes one generic label, so
//     the frontend computes a per-status label for the table cells)
//   - status → primary action classification (what CTA to show in the
//     "action" column of the table)
//
// Why one module: every consumer (toolbar filter chips, summary chips,
// table cell renderer, action button) needs the same mapping. Splitting
// these across files would cause silent drift between, e.g., the filter
// UI and the badge colors.

import { RequestStatus } from "@hassad/shared";
import type { UIStatus } from "./statusMapping";
import type { PortalRequestSummary } from "@/features/portal/portalApi";

/**
 * Map a backend `RequestStatus` to the badge UI status.
 *
 * Note: `PROJECT_CREATED` and `CANCELLED` are filtered out at the API
 * layer, but we still handle them defensively so the function never
 * throws on an unexpected value.
 */
export function mapRequestStatusToUI(status: string): UIStatus {
  switch (status) {
    case RequestStatus.SUBMITTED:
    case RequestStatus.QUALIFYING:
      return "pending";
    case RequestStatus.PROPOSAL_IN_PROGRESS:
    case RequestStatus.CONTRACT_PREPARATION:
      return "in-progress";
    case RequestStatus.PROPOSAL_SENT:
    case RequestStatus.NEGOTIATION:
      return "awaiting-review";
    case RequestStatus.CONTRACT_SENT:
      return "awaiting-review";
    case RequestStatus.SIGNED:
    case RequestStatus.PROJECT_CREATED:
      return "completed";
    case RequestStatus.CANCELLED:
      return "cancelled";
    default:
      return "pending";
  }
}

/**
 * Per-status Arabic label for the badge cell and summary chips.
 *
 * The backend returns `statusLabel: "طلب قيد الانتظار"` for every pending
 * request — too generic for a table where each row needs a meaningful
 * label. The frontend computes the right label here. This stays in sync
 * with the backend's `getPendingRequestStageLabel` (which returns the
 * `stageLabel` field, a longer descriptive sentence).
 */
export function getRequestStatusLabel(status: string): string {
  switch (status) {
    case RequestStatus.SUBMITTED:
      return "مستلم";
    case RequestStatus.QUALIFYING:
      return "قيد التأهيل";
    case RequestStatus.PROPOSAL_IN_PROGRESS:
      return "إعداد العرض";
    case RequestStatus.PROPOSAL_SENT:
      return "العرض جاهز";
    case RequestStatus.NEGOTIATION:
      return "قيد التفاوض";
    case RequestStatus.CONTRACT_PREPARATION:
      return "تجهيز العقد";
    case RequestStatus.CONTRACT_SENT:
      return "بانتظار توقيعك";
    case RequestStatus.SIGNED:
      return "موقّع";
    case RequestStatus.PROJECT_CREATED:
      return "تحوّل إلى مشروع";
    case RequestStatus.CANCELLED:
      return "ملغي";
    default:
      return status;
  }
}

/**
 * What action (if any) the client needs to take on this request.
 *
 * Pure function — derived from the request data, no state. The table's
 * "Action" column renders the result of this classification.
 */
export type RequestAction =
  | { kind: "review-proposal"; href: string }
  | { kind: "sign-contract"; href: string }
  | { kind: "in-progress" }
  | { kind: "completed" };

export function getRequestAction(request: PortalRequestSummary): RequestAction {
  // Contract awaiting client signature is the highest-priority action.
  if (
    request.status === RequestStatus.CONTRACT_SENT &&
    request.latestContract?.url
  ) {
    return { kind: "sign-contract", href: request.latestContract.url };
  }

  // Proposal ready for review/negotiation.
  if (
    (request.status === RequestStatus.PROPOSAL_SENT ||
      request.status === RequestStatus.NEGOTIATION) &&
    request.latestProposal?.url
  ) {
    return { kind: "review-proposal", href: request.latestProposal.url };
  }

  // Sales team is working on it — no client action.
  if (
    request.status === RequestStatus.SUBMITTED ||
    request.status === RequestStatus.QUALIFYING ||
    request.status === RequestStatus.PROPOSAL_IN_PROGRESS ||
    request.status === RequestStatus.CONTRACT_PREPARATION
  ) {
    return { kind: "in-progress" };
  }

  return { kind: "completed" };
}

/**
 * Human-readable label for an action. Used in the action cell.
 */
export function getRequestActionLabel(action: RequestAction): string {
  switch (action.kind) {
    case "sign-contract":
      return "توقيع العقد";
    case "review-proposal":
      return "عرض العرض";
    case "in-progress":
      return "جاري العمل";
    case "completed":
      return "مكتمل";
  }
}

/**
 * Distinct visual tone for an action's button. The action button uses
 * this to pick between filled-primary, outline, and muted variants so
 * the highest-priority action (sign contract) is the most prominent.
 */
export type ActionTone = "primary" | "outline" | "muted";

export function getRequestActionTone(action: RequestAction): ActionTone {
  switch (action.kind) {
    case "sign-contract":
      return "primary";
    case "review-proposal":
      return "outline";
    case "in-progress":
      return "muted";
    case "completed":
      return "muted";
  }
}

/**
 * High-level status group used by the toolbar filter and summary chips.
 *
 * Six groups instead of nine statuses — gives the user meaningful filter
 * buckets without exposing the underlying enum complexity. Each group maps
 * to one or more raw `RequestStatus` values.
 */
export type RequestStatusGroup =
  | "all"
  | "received" // SUBMITTED, QUALIFYING
  | "preparing" // PROPOSAL_IN_PROGRESS, CONTRACT_PREPARATION
  | "awaiting-you" // PROPOSAL_SENT, NEGOTIATION, CONTRACT_SENT
  | "signed" // SIGNED
  | "cancelled"; // CANCELLED

export const REQUEST_STATUS_GROUPS: Record<
  Exclude<RequestStatusGroup, "all">,
  readonly string[]
> = {
  received: [RequestStatus.SUBMITTED, RequestStatus.QUALIFYING],
  preparing: [
    RequestStatus.PROPOSAL_IN_PROGRESS,
    RequestStatus.CONTRACT_PREPARATION,
  ],
  "awaiting-you": [
    RequestStatus.PROPOSAL_SENT,
    RequestStatus.NEGOTIATION,
    RequestStatus.CONTRACT_SENT,
  ],
  signed: [RequestStatus.SIGNED],
  cancelled: [RequestStatus.CANCELLED],
};

/**
 * Arabic label for a status group — used by the summary chips and the
 * toolbar filter dropdown.
 */
export const REQUEST_STATUS_GROUP_LABELS: Record<RequestStatusGroup, string> = {
  all: "الكل",
  received: "مستلم",
  preparing: "قيد الإعداد",
  "awaiting-you": "بانتظار توقيعك",
  signed: "موقّع",
  cancelled: "ملغي",
};

/**
 * Resolve a status to its status group. Falls back to "received" for
 * unknown values so unknown statuses never disappear from the UI.
 */
export function resolveStatusGroup(status: string): RequestStatusGroup {
  for (const [group, statuses] of Object.entries(REQUEST_STATUS_GROUPS) as [
    Exclude<RequestStatusGroup, "all">,
    readonly string[],
  ][]) {
    if (statuses.includes(status)) return group;
  }
  return "received";
}
