import { ProposalStatus } from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";

export type ProposalDirectoryFilter =
  | "all"
  | "sent"
  | "approved"
  | "revision-requested"
  | "rejected";
export type ProposalDateFilter = "all-time" | "last-7-days" | "last-30-days" | "last-90-days";
export type ProposalValueFilter =
  | "all-values"
  | "under-15000"
  | "15000-30000"
  | "30000-50000"
  | "50000-plus";

export type ProposalDirectoryRecord = {
  id: string;
  title: string;
  clientName: string;
  requestName: string;
  creator: string;
  servicesCount: number;
  servicesLabel: string;
  totalValue: number;
  status: ProposalStatus;
  statusTone: StatusTone;
  sentAtLabel: string;
  sentDaysAgo: number;
  responseLabel: string;
  validUntilLabel: string;
  validityDaysLeft: number;
  validityTone: StatusTone;
  contractLabel: string;
  contractTone: StatusTone;
};

const proposalStatusLabels: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "Draft",
  [ProposalStatus.SENT]: "Sent",
  [ProposalStatus.APPROVED]: "Approved",
  [ProposalStatus.REVISION_REQUESTED]: "Revision requested",
  [ProposalStatus.REJECTED]: "Rejected",
};

export const proposalDirectoryRecords: ProposalDirectoryRecord[] = [
  {
    id: "proposal-greenline-retainer",
    title: "Greenline growth retainer",
    clientName: "Greenline",
    requestName: "Brand retainer upgrade",
    creator: "Omar Nasser",
    servicesCount: 4,
    servicesLabel: "Paid social, creative, reporting",
    totalValue: 42000,
    status: ProposalStatus.SENT,
    statusTone: "warning",
    sentAtLabel: "Sent 6d ago",
    sentDaysAgo: 6,
    responseLabel: "No response",
    validUntilLabel: "Valid until Aug 12, 2026",
    validityDaysLeft: 4,
    validityTone: "warning",
    contractLabel: "Not created",
    contractTone: "neutral",
  },
  {
    id: "proposal-al-noor-launch",
    title: "Al Noor launch package",
    clientName: "Al Noor",
    requestName: "Launch campaign scope",
    creator: "Mona Saleh",
    servicesCount: 3,
    servicesLabel: "Campaign setup, content, reporting",
    totalValue: 28000,
    status: ProposalStatus.REVISION_REQUESTED,
    statusTone: "attention",
    sentAtLabel: "Sent 3d ago",
    sentDaysAgo: 3,
    responseLabel: "Revision Aug 7",
    validUntilLabel: "Valid until Aug 25, 2026",
    validityDaysLeft: 17,
    validityTone: "success",
    contractLabel: "Not created",
    contractTone: "neutral",
  },
  {
    id: "proposal-enterprise-foods-rebrand",
    title: "Enterprise Foods rebrand",
    clientName: "Enterprise Foods",
    requestName: "Rebrand and trade rollout",
    creator: "Mona Saleh",
    servicesCount: 5,
    servicesLabel: "Brand strategy, packaging, rollout",
    totalValue: 54000,
    status: ProposalStatus.APPROVED,
    statusTone: "success",
    sentAtLabel: "Sent 9d ago",
    sentDaysAgo: 9,
    responseLabel: "Approved Aug 6",
    validUntilLabel: "Valid until Aug 20, 2026",
    validityDaysLeft: 12,
    validityTone: "success",
    contractLabel: "Ready for contract",
    contractTone: "success",
  },
  {
    id: "proposal-pulse-crm-rollout",
    title: "Pulse CRM rollout",
    clientName: "Pulse Health",
    requestName: "CRM migration workshop",
    creator: "Omar Nasser",
    servicesCount: 4,
    servicesLabel: "Automation, migration, dashboards",
    totalValue: 33000,
    status: ProposalStatus.DRAFT,
    statusTone: "neutral",
    sentAtLabel: "Not sent",
    sentDaysAgo: 0,
    responseLabel: "No response",
    validUntilLabel: "Validity not started",
    validityDaysLeft: 999,
    validityTone: "neutral",
    contractLabel: "Not created",
    contractTone: "neutral",
  },
  {
    id: "proposal-oasis-loyalty",
    title: "Oasis loyalty activation",
    clientName: "Oasis Retail",
    requestName: "Store loyalty launch",
    creator: "Omar Nasser",
    servicesCount: 2,
    servicesLabel: "Activation plan, store assets",
    totalValue: 12000,
    status: ProposalStatus.REJECTED,
    statusTone: "destructive",
    sentAtLabel: "Sent 14d ago",
    sentDaysAgo: 14,
    responseLabel: "Rejected Aug 3",
    validUntilLabel: "Expired Aug 5, 2026",
    validityDaysLeft: -3,
    validityTone: "destructive",
    contractLabel: "Closed",
    contractTone: "destructive",
  },
  {
    id: "proposal-riyadh-clinics-growth",
    title: "Riyadh Clinics lead gen",
    clientName: "Riyadh Clinics",
    requestName: "Lead generation package",
    creator: "Mona Saleh",
    servicesCount: 3,
    servicesLabel: "Landing pages, ads, optimization",
    totalValue: 18000,
    status: ProposalStatus.SENT,
    statusTone: "warning",
    sentAtLabel: "Sent 1d ago",
    sentDaysAgo: 1,
    responseLabel: "No response",
    validUntilLabel: "Valid until Aug 29, 2026",
    validityDaysLeft: 21,
    validityTone: "success",
    contractLabel: "Not created",
    contractTone: "neutral",
  },
];

export function formatProposalCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatProposalStatus(status: ProposalStatus) {
  return proposalStatusLabels[status];
}

export function getFilteredProposals(
  statusFilter: ProposalDirectoryFilter,
  dateFilter: ProposalDateFilter,
  valueFilter: ProposalValueFilter
) {
  return proposalDirectoryRecords
    .filter((row) => {
      if (statusFilter === "sent") return row.status === ProposalStatus.SENT;
      if (statusFilter === "approved") return row.status === ProposalStatus.APPROVED;
      if (statusFilter === "revision-requested") {
        return row.status === ProposalStatus.REVISION_REQUESTED;
      }
      if (statusFilter === "rejected") return row.status === ProposalStatus.REJECTED;
      return true;
    })
    .filter((row) => {
      if (dateFilter === "last-7-days") return row.sentDaysAgo <= 7;
      if (dateFilter === "last-30-days") return row.sentDaysAgo <= 30;
      if (dateFilter === "last-90-days") return row.sentDaysAgo <= 90;
      return true;
    })
    .filter((row) => {
      if (valueFilter === "under-15000") return row.totalValue < 15000;
      if (valueFilter === "15000-30000") {
        return row.totalValue >= 15000 && row.totalValue < 30000;
      }
      if (valueFilter === "30000-50000") {
        return row.totalValue >= 30000 && row.totalValue < 50000;
      }
      if (valueFilter === "50000-plus") return row.totalValue >= 50000;
      return true;
    })
    .toSorted((left, right) => right.totalValue - left.totalValue);
}
