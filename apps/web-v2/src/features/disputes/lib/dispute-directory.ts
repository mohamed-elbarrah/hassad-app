import {
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";

export type DisputeQueueFilter =
  | "all"
  | "pending-approval"
  | "escalated"
  | "active"
  | "resolved";

export type DisputeStaleFilter = "all-activity" | "stale-3-days" | "stale-7-days";

export type DisputeDirectoryRecord = {
  id: string;
  ticketNumber: string;
  title: string;
  clientName: string;
  projectName: string;
  pmName: string;
  category: DisputeCategory;
  priority: DisputePriority;
  status: DisputeStatus;
  openedAtLabel: string;
  lastActivityLabel: string;
  staleDays: number;
  signalLabel: string;
  signalSummary: string;
  signalTone: StatusTone;
};

const categoryLabels: Record<DisputeCategory, string> = {
  [DisputeCategory.DELAY]: "Delay",
  [DisputeCategory.QUALITY]: "Quality",
  [DisputeCategory.COMMUNICATION]: "Communication",
  [DisputeCategory.BUDGET]: "Budget",
  [DisputeCategory.SCOPE]: "Scope",
  [DisputeCategory.ATTITUDE]: "Attitude",
  [DisputeCategory.OTHER]: "Other",
};

const priorityLabels: Record<DisputePriority, string> = {
  [DisputePriority.LOW]: "Low",
  [DisputePriority.NORMAL]: "Normal",
  [DisputePriority.HIGH]: "High",
  [DisputePriority.URGENT]: "Urgent",
};

const statusLabels: Record<DisputeStatus, string> = {
  [DisputeStatus.PENDING_APPROVAL]: "Pending approval",
  [DisputeStatus.REJECTED]: "Rejected",
  [DisputeStatus.APPROVED]: "Approved",
  [DisputeStatus.IN_PROGRESS]: "In progress",
  [DisputeStatus.PENDING_CLIENT]: "Waiting client",
  [DisputeStatus.ESCALATED]: "Escalated",
  [DisputeStatus.RESOLVED]: "Resolved",
  [DisputeStatus.CLOSED]: "Closed",
};

export const disputeDirectoryRecords: DisputeDirectoryRecord[] = [
  {
    id: "dispute-greenline-delay-1042",
    ticketNumber: "#1042",
    title: "August paid media assets missed the client review window",
    clientName: "Greenline",
    projectName: "Greenline growth retainer",
    pmName: "Mona Saleh",
    category: DisputeCategory.DELAY,
    priority: DisputePriority.HIGH,
    status: DisputeStatus.PENDING_APPROVAL,
    openedAtLabel: "Opened today",
    lastActivityLabel: "10m ago",
    staleDays: 0,
    signalLabel: "Needs approval",
    signalSummary: "Admin must accept or reject before the PM can respond",
    signalTone: "destructive",
  },
  {
    id: "dispute-riyadh-quality-1038",
    ticketNumber: "#1038",
    title: "Landing page revisions are still not matching clinic guidelines",
    clientName: "Riyadh Clinics",
    projectName: "Riyadh Clinics growth engine",
    pmName: "Fadi Kareem",
    category: DisputeCategory.QUALITY,
    priority: DisputePriority.URGENT,
    status: DisputeStatus.ESCALATED,
    openedAtLabel: "Opened Aug 2, 2026",
    lastActivityLabel: "4d ago",
    staleDays: 4,
    signalLabel: "Escalated",
    signalSummary: "Client rejected the proposed resolution and the case is aging",
    signalTone: "destructive",
  },
  {
    id: "dispute-safa-communication-1031",
    ticketNumber: "#1031",
    title: "Client has not received a clear response on review timing",
    clientName: "Safa Logistics",
    projectName: "Safa employer brand system",
    pmName: "Mona Saleh",
    category: DisputeCategory.COMMUNICATION,
    priority: DisputePriority.NORMAL,
    status: DisputeStatus.IN_PROGRESS,
    openedAtLabel: "Opened Aug 4, 2026",
    lastActivityLabel: "Yesterday",
    staleDays: 1,
    signalLabel: "Waiting PM",
    signalSummary: "PM acknowledged the dispute but no client-facing update has gone out today",
    signalTone: "warning",
  },
  {
    id: "dispute-al-noor-scope-1027",
    ticketNumber: "#1027",
    title: "Client says launch deliverables now include extra packaging work",
    clientName: "Al Noor",
    projectName: "Al Noor launch campaign",
    pmName: "Mona Saleh",
    category: DisputeCategory.SCOPE,
    priority: DisputePriority.HIGH,
    status: DisputeStatus.PENDING_CLIENT,
    openedAtLabel: "Opened Jul 31, 2026",
    lastActivityLabel: "2d ago",
    staleDays: 2,
    signalLabel: "Waiting client",
    signalSummary: "Resolution was proposed and is waiting for client confirmation",
    signalTone: "attention",
  },
  {
    id: "dispute-pulse-budget-1022",
    ticketNumber: "#1022",
    title: "Client disputes activation timing against first-payment clearance",
    clientName: "Pulse Health",
    projectName: "Pulse CRM rollout",
    pmName: "Fadi Kareem",
    category: DisputeCategory.BUDGET,
    priority: DisputePriority.NORMAL,
    status: DisputeStatus.APPROVED,
    openedAtLabel: "Opened Jul 30, 2026",
    lastActivityLabel: "5d ago",
    staleDays: 5,
    signalLabel: "Past deadline",
    signalSummary: "Approved case is stale and close to auto-escalation",
    signalTone: "destructive",
  },
  {
    id: "dispute-enterprise-attitude-1016",
    ticketNumber: "#1016",
    title: "Client complained about workshop tone during discovery session",
    clientName: "Enterprise Foods",
    projectName: "Enterprise Foods rebrand",
    pmName: "Mona Saleh",
    category: DisputeCategory.ATTITUDE,
    priority: DisputePriority.NORMAL,
    status: DisputeStatus.RESOLVED,
    openedAtLabel: "Opened Jul 27, 2026",
    lastActivityLabel: "Today",
    staleDays: 0,
    signalLabel: "Ready to close",
    signalSummary: "Client confirmed the resolution and admin can close the case",
    signalTone: "success",
  },
  {
    id: "dispute-oasis-other-1009",
    ticketNumber: "#1009",
    title: "Client asked for executive review after repeated deadline changes",
    clientName: "Oasis Retail",
    projectName: "Oasis loyalty activation",
    pmName: "Fadi Kareem",
    category: DisputeCategory.OTHER,
    priority: DisputePriority.URGENT,
    status: DisputeStatus.CLOSED,
    openedAtLabel: "Opened Jul 18, 2026",
    lastActivityLabel: "Closed Aug 6, 2026",
    staleDays: 0,
    signalLabel: "Closed",
    signalSummary: "Closed after PM reassignment and admin confirmation",
    signalTone: "neutral",
  },
];

export function formatDisputeCategory(value: DisputeCategory) {
  return categoryLabels[value];
}

export function formatDisputePriority(value: DisputePriority) {
  return priorityLabels[value];
}

export function formatDisputeStatus(value: DisputeStatus) {
  return statusLabels[value];
}

export function getDisputePriorityTone(priority: DisputePriority): StatusTone {
  if (priority === DisputePriority.URGENT) return "destructive";
  if (priority === DisputePriority.HIGH) return "warning";
  if (priority === DisputePriority.NORMAL) return "active";
  return "neutral";
}

export function getDisputeStatusTone(status: DisputeStatus): StatusTone {
  if (status === DisputeStatus.PENDING_APPROVAL) return "destructive";
  if (status === DisputeStatus.ESCALATED) return "destructive";
  if (status === DisputeStatus.REJECTED) return "neutral";
  if (status === DisputeStatus.RESOLVED) return "success";
  if (status === DisputeStatus.CLOSED) return "neutral";
  if (status === DisputeStatus.PENDING_CLIENT) return "attention";
  if (status === DisputeStatus.IN_PROGRESS) return "warning";
  return "active";
}

export function getFilteredDisputes(params: {
  search: string;
  queue: DisputeQueueFilter;
  status: DisputeStatus | "all-statuses";
  category: DisputeCategory | "all-categories";
  priority: DisputePriority | "all-priorities";
  pm: string | "all-pms";
  stale: DisputeStaleFilter;
}) {
  const query = params.search.trim().toLowerCase();

  return disputeDirectoryRecords
    .filter((row) => {
      if (!query) return true;

      return [
        row.ticketNumber,
        row.title,
        row.clientName,
        row.projectName,
        row.pmName,
        formatDisputeCategory(row.category),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((row) => {
      if (params.queue === "pending-approval") {
        return row.status === DisputeStatus.PENDING_APPROVAL;
      }

      if (params.queue === "escalated") {
        return row.status === DisputeStatus.ESCALATED;
      }

      if (params.queue === "active") {
        return [
          DisputeStatus.APPROVED,
          DisputeStatus.IN_PROGRESS,
          DisputeStatus.PENDING_CLIENT,
        ].includes(row.status);
      }

      if (params.queue === "resolved") {
        return [DisputeStatus.RESOLVED, DisputeStatus.CLOSED].includes(row.status);
      }

      return true;
    })
    .filter((row) => {
      if (params.status === "all-statuses") return true;
      return row.status === params.status;
    })
    .filter((row) => {
      if (params.category === "all-categories") return true;
      return row.category === params.category;
    })
    .filter((row) => {
      if (params.priority === "all-priorities") return true;
      return row.priority === params.priority;
    })
    .filter((row) => {
      if (params.pm === "all-pms") return true;
      return row.pmName === params.pm;
    })
    .filter((row) => {
      if (params.stale === "stale-3-days") return row.staleDays >= 3;
      if (params.stale === "stale-7-days") return row.staleDays >= 7;
      return true;
    })
    .toSorted((left, right) => {
      const rank = (value: DisputeStatus) => {
        if (value === DisputeStatus.PENDING_APPROVAL) return 1;
        if (value === DisputeStatus.ESCALATED) return 2;
        if (
          value === DisputeStatus.APPROVED ||
          value === DisputeStatus.IN_PROGRESS ||
          value === DisputeStatus.PENDING_CLIENT
        ) {
          return 3;
        }
        if (value === DisputeStatus.RESOLVED) return 4;
        if (value === DisputeStatus.CLOSED) return 5;
        return 6;
      };

      const statusRank = rank(left.status) - rank(right.status);
      if (statusRank !== 0) return statusRank;

      if (left.staleDays !== right.staleDays) {
        return right.staleDays - left.staleDays;
      }

      return left.ticketNumber.localeCompare(right.ticketNumber);
    });
}

export function getDisputePmOptions() {
  return Array.from(new Set(disputeDirectoryRecords.map((item) => item.pmName))).toSorted();
}
