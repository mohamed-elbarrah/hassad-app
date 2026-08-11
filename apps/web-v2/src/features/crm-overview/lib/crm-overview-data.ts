import { formatDistanceToNow } from "date-fns";
import { BusinessType, ClientSource } from "@hassad/shared";

import type { KanbanItem, KanbanLane, KanbanSection } from "@/components/patterns/grouped-kanban-board";
import type { StatusTone } from "@/components/patterns/status-badge";

export type CrmOverviewBoardFilter = "all" | "leads" | "orders";
export type CrmOverviewKind = "lead" | "order";
export type CrmOverviewStatus =
  | "NEW"
  | "SCHEDULED"
  | "DONE"
  | "FAILED"
  | "SENT"
  | "NEGOTIATION"
  | "APPROVED"
  | "REJECTED"
  | "CONTRACT_SENT"
  | "SIGNED"
  | "ACTIVE"
  | "CANCELLED";

export type CrmOverviewRecord = KanbanItem & {
  kind: CrmOverviewKind;
  status: CrmOverviewStatus;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  businessName: string;
  businessType: BusinessType;
  source: ClientSource;
  owner: string;
  serviceLine: string;
  note: string;
  lastActivityAt: string;
  createdAt: string;
  attemptCount: number;
  requiresNote?: boolean;
};

const kindLabel: Record<CrmOverviewKind, string> = {
  lead: "Lead",
  order: "Order",
};

const businessTypeLabel: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "Restaurant",
  [BusinessType.CLINIC]: "Clinic",
  [BusinessType.STORE]: "Store",
  [BusinessType.SERVICE]: "Service",
  [BusinessType.OTHER]: "Other",
};

const sourceLabel: Record<ClientSource, string> = {
  [ClientSource.AD]: "Ad",
  [ClientSource.REFERRAL]: "Referral",
  [ClientSource.WEBSITE]: "Website",
  [ClientSource.WHATSAPP]: "WhatsApp",
  [ClientSource.PLATFORM]: "Platform",
};

const statusLabel: Record<CrmOverviewStatus, string> = {
  NEW: "New",
  SCHEDULED: "Scheduled",
  DONE: "Done",
  FAILED: "Failed",
  SENT: "Create & Sent",
  NEGOTIATION: "Negotiation",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONTRACT_SENT: "Create & Sent Contract",
  SIGNED: "Signed",
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
};

const statusTone: Record<CrmOverviewStatus, StatusTone> = {
  NEW: "neutral",
  SCHEDULED: "active",
  DONE: "success",
  FAILED: "warning",
  SENT: "active",
  NEGOTIATION: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  CONTRACT_SENT: "active",
  SIGNED: "success",
  ACTIVE: "success",
  CANCELLED: "destructive",
};

const statusGroupLabel: Record<"intake" | "meeting" | "proposal" | "contract", string> = {
  intake: "Intake & outreach",
  meeting: "Meeting & call attempts",
  proposal: "Proposal flow",
  contract: "Contract flow",
};

const statusGroupTone: Record<"intake" | "meeting" | "proposal" | "contract", StatusTone> = {
  intake: "neutral",
  meeting: "active",
  proposal: "warning",
  contract: "success",
};

export const CRM_OVERVIEW_STATUS_GROUPS: Array<{
  id: "intake" | "meeting" | "proposal" | "contract";
  statuses: CrmOverviewStatus[];
}> = [
  { id: "intake", statuses: ["NEW"] },
  { id: "meeting", statuses: ["SCHEDULED", "DONE", "FAILED"] },
  { id: "proposal", statuses: ["SENT", "NEGOTIATION", "APPROVED", "REJECTED"] },
  { id: "contract", statuses: ["CONTRACT_SENT", "SIGNED", "ACTIVE", "CANCELLED"] },
];

export const NOTE_REQUIRED_STATUSES: CrmOverviewStatus[] = [
  "FAILED",
  "NEGOTIATION",
  "REJECTED",
  "CANCELLED",
];

export const CRM_OVERVIEW_FIXTURE: CrmOverviewRecord[] = [
  {
    id: "rec-1",
    kind: "lead",
    status: "NEW",
    companyName: "Northstar Clinics",
    contactName: "Mona Al-Shehri",
    phoneWhatsapp: "+966501110001",
    businessName: "Northstar Clinics",
    businessType: BusinessType.CLINIC,
    source: ClientSource.WEBSITE,
    owner: "Omar",
    serviceLine: "Performance marketing",
    note: "Inbound request for a new monthly growth plan.",
    lastActivityAt: "2026-08-10T09:15:00.000Z",
    createdAt: "2026-08-09T11:00:00.000Z",
    attemptCount: 1,
  },
  {
    id: "rec-2",
    kind: "lead",
    status: "SCHEDULED",
    companyName: "Brightline Academy",
    contactName: "Khalid Saeed",
    phoneWhatsapp: "+966501110004",
    businessName: "Brightline Academy",
    businessType: BusinessType.SERVICE,
    source: ClientSource.PLATFORM,
    owner: "Ameer",
    serviceLine: "Lead generation",
    note: "Discovery call is booked for Thursday morning.",
    lastActivityAt: "2026-08-10T08:05:00.000Z",
    createdAt: "2026-08-04T10:00:00.000Z",
    attemptCount: 2,
  },
  {
    id: "rec-3",
    kind: "order",
    status: "DONE",
    companyName: "Seashore Hospitality",
    contactName: "Rana Ali",
    phoneWhatsapp: "+966501110005",
    businessName: "Seashore Hospitality",
    businessType: BusinessType.RESTAURANT,
    source: ClientSource.WHATSAPP,
    owner: "Hassan",
    serviceLine: "Campaign management",
    note: "Discovery is complete and pricing recap is ready.",
    lastActivityAt: "2026-08-10T12:40:00.000Z",
    createdAt: "2026-08-03T14:00:00.000Z",
    attemptCount: 4,
  },
  {
    id: "rec-4",
    kind: "order",
    status: "FAILED",
    companyName: "Green Mart",
    contactName: "Nora Hassan",
    phoneWhatsapp: "+966501110003",
    businessName: "Green Mart",
    businessType: BusinessType.STORE,
    source: ClientSource.AD,
    owner: "Lina",
    serviceLine: "Social content",
    note: "Call attempt failed and needs a reason note before retrying.",
    lastActivityAt: "2026-08-09T15:00:00.000Z",
    createdAt: "2026-08-05T16:00:00.000Z",
    attemptCount: 3,
    requiresNote: true,
  },
  {
    id: "rec-5",
    kind: "lead",
    status: "SENT",
    companyName: "Velora Fashion",
    contactName: "Dalia Omar",
    phoneWhatsapp: "+966501110006",
    businessName: "Velora Fashion",
    businessType: BusinessType.STORE,
    source: ClientSource.AD,
    owner: "Nadia",
    serviceLine: "Paid media",
    note: "Proposal sent and waiting on commercial review.",
    lastActivityAt: "2026-08-10T07:45:00.000Z",
    createdAt: "2026-08-02T09:10:00.000Z",
    attemptCount: 3,
  },
  {
    id: "rec-6",
    kind: "order",
    status: "NEGOTIATION",
    companyName: "Cedar Fashion",
    contactName: "Rami Fares",
    phoneWhatsapp: "+966501110005",
    businessName: "Cedar Fashion",
    businessType: BusinessType.STORE,
    source: ClientSource.PLATFORM,
    owner: "Hassan",
    serviceLine: "Paid ads",
    note: "Negotiation is active and needs a decision note.",
    lastActivityAt: "2026-08-10T13:15:00.000Z",
    createdAt: "2026-08-04T15:15:00.000Z",
    attemptCount: 4,
    requiresNote: true,
  },
  {
    id: "rec-7",
    kind: "lead",
    status: "APPROVED",
    companyName: "Safi Logistics",
    contactName: "Majed Ali",
    phoneWhatsapp: "+966501110008",
    businessName: "Safi Logistics",
    businessType: BusinessType.SERVICE,
    source: ClientSource.WEBSITE,
    owner: "Sara",
    serviceLine: "Strategy and media",
    note: "Commercial approval received; contract is next.",
    lastActivityAt: "2026-08-10T13:20:00.000Z",
    createdAt: "2026-07-28T10:30:00.000Z",
    attemptCount: 4,
  },
  {
    id: "rec-8",
    kind: "lead",
    status: "REJECTED",
    companyName: "Pulse Medical",
    contactName: "Amani Saleh",
    phoneWhatsapp: "+966501110007",
    businessName: "Pulse Medical",
    businessType: BusinessType.CLINIC,
    source: ClientSource.REFERRAL,
    owner: "Omar",
    serviceLine: "Retainer support",
    note: "Rejected after budget review; keep reason for later reporting.",
    lastActivityAt: "2026-08-07T16:20:00.000Z",
    createdAt: "2026-07-30T11:30:00.000Z",
    attemptCount: 5,
    requiresNote: true,
  },
  {
    id: "rec-9",
    kind: "order",
    status: "CONTRACT_SENT",
    companyName: "Mint Dental",
    contactName: "Abdullah Noor",
    phoneWhatsapp: "+966501110009",
    businessName: "Mint Dental",
    businessType: BusinessType.CLINIC,
    source: ClientSource.WHATSAPP,
    owner: "Ameer",
    serviceLine: "Lead generation",
    note: "Contract sent and waiting for signature.",
    lastActivityAt: "2026-08-10T06:30:00.000Z",
    createdAt: "2026-08-02T11:15:00.000Z",
    attemptCount: 4,
  },
  {
    id: "rec-10",
    kind: "order",
    status: "SIGNED",
    companyName: "Harbor Foods",
    contactName: "Alaa Hassan",
    phoneWhatsapp: "+966501110010",
    businessName: "Harbor Foods",
    businessType: BusinessType.RESTAURANT,
    source: ClientSource.REFERRAL,
    owner: "Lina",
    serviceLine: "Launch campaign",
    note: "Signed and ready to move into active delivery.",
    lastActivityAt: "2026-08-11T05:40:00.000Z",
    createdAt: "2026-08-01T09:20:00.000Z",
    attemptCount: 3,
  },
  {
    id: "rec-11",
    kind: "order",
    status: "ACTIVE",
    companyName: "Orbit Studios",
    contactName: "Mina Youssef",
    phoneWhatsapp: "+966501110011",
    businessName: "Orbit Studios",
    businessType: BusinessType.SERVICE,
    source: ClientSource.AD,
    owner: "Nadia",
    serviceLine: "Content strategy",
    note: "Contract is active and delivery has started.",
    lastActivityAt: "2026-08-10T15:05:00.000Z",
    createdAt: "2026-07-30T14:20:00.000Z",
    attemptCount: 2,
  },
  {
    id: "rec-12",
    kind: "order",
    status: "CANCELLED",
    companyName: "Atlas Supply",
    contactName: "Waleed Omar",
    phoneWhatsapp: "+966501110012",
    businessName: "Atlas Supply",
    businessType: BusinessType.STORE,
    source: ClientSource.PLATFORM,
    owner: "Sara",
    serviceLine: "Growth support",
    note: "Cancelled after the budget changed internally.",
    lastActivityAt: "2026-08-07T11:10:00.000Z",
    createdAt: "2026-07-28T13:00:00.000Z",
    attemptCount: 2,
    requiresNote: true,
  },
];

function formatRelative(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function buildSection<T extends CrmOverviewRecord>(
  status: CrmOverviewStatus,
  records: T[],
): KanbanSection<T> {
  return {
    id: status,
    title: statusLabel[status],
    tone: statusTone[status],
    items: records.filter((record) => record.status === status),
    emptyLabel: `No cards in ${statusLabel[status].toLowerCase()}.`,
  };
}

export function buildOverviewLanes(records: CrmOverviewRecord[]): KanbanLane<CrmOverviewRecord>[] {
  return CRM_OVERVIEW_STATUS_GROUPS.map((group) => ({
    id: group.id,
    title: statusGroupLabel[group.id],
    tone: statusGroupTone[group.id],
    sections: group.statuses.map((status) => buildSection(status, records)),
  }));
}

export function filterOverviewRecords(records: CrmOverviewRecord[], filter: CrmOverviewBoardFilter) {
  if (filter === "leads") return records.filter((record) => record.kind === "lead");
  if (filter === "orders") return records.filter((record) => record.kind === "order");
  return records;
}

export function matchesOverviewSearch(record: CrmOverviewRecord, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    record.companyName,
    record.contactName,
    record.businessName,
    kindLabel[record.kind],
    businessTypeLabel[record.businessType],
    sourceLabel[record.source],
    record.owner,
    record.serviceLine,
    record.note,
    record.phoneWhatsapp,
    statusLabel[record.status],
  ].some((value) => value.toLowerCase().includes(normalized));
}

export function formatOverviewRecord(record: CrmOverviewRecord) {
  return {
    kindLabel: kindLabel[record.kind],
    businessTypeLabel: businessTypeLabel[record.businessType],
    sourceLabel: sourceLabel[record.source],
    statusLabel: statusLabel[record.status],
    statusTone: statusTone[record.status],
    lastActivityLabel: formatRelative(record.lastActivityAt),
    ageLabel: formatRelative(record.createdAt),
  };
}

export function isNoteRequired(status: CrmOverviewStatus) {
  return NOTE_REQUIRED_STATUSES.includes(status);
}

export function getAllowedStatusesForRecord(status: CrmOverviewStatus) {
  return CRM_OVERVIEW_STATUS_GROUPS.find((group) => group.statuses.includes(status))?.statuses ?? [status];
}

export function canOpenProposalFromStatus(status: CrmOverviewStatus) {
  return status === "SENT";
}

export function canCreateContractFromStatus(status: CrmOverviewStatus) {
  return status === "APPROVED";
}

export function canOpenContractFromStatus(status: CrmOverviewStatus) {
  return status === "CONTRACT_SENT";
}
