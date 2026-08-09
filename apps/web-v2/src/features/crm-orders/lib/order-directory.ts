import {
  ClientSource,
  PipelineStage,
  PIPELINE_UI_MAP,
  ProposalStatus,
  type CrmWorkspaceRecord,
} from "@hassad/shared";

export type OrderDirectoryFilter =
  | "all"
  | "active"
  | "waiting-approval"
  | "stalled";
export type OrderDateFilter = "all-time" | "last-7-days" | "last-30-days" | "last-90-days";
export type OrderValueFilter =
  | "all-values"
  | "under-15000"
  | "15000-30000"
  | "30000-50000"
  | "50000-plus";

export type OrderDirectoryRecord = CrmWorkspaceRecord;
type OrderDirectorySeedRecord = Omit<
  OrderDirectoryRecord,
  | "contactAttemptCount"
  | "meetingsCount"
  | "projectSignalLabel"
  | "projectSignalTone"
>;

const sourceLabels: Record<ClientSource, string> = {
  [ClientSource.AD]: "Paid campaign",
  [ClientSource.REFERRAL]: "Referral",
  [ClientSource.WEBSITE]: "Website",
  [ClientSource.WHATSAPP]: "WhatsApp",
  [ClientSource.PLATFORM]: "Platform",
};

const proposalLabels: Record<ProposalStatus, string> = {
  [ProposalStatus.DRAFT]: "Draft",
  [ProposalStatus.SENT]: "Sent",
  [ProposalStatus.APPROVED]: "Approved",
  [ProposalStatus.REVISION_REQUESTED]: "Revision requested",
  [ProposalStatus.REJECTED]: "Rejected",
};

const orderDirectorySeed: OrderDirectorySeedRecord[] = [
  {
    id: "order-greenline-brand-retainer",
    companyName: "Greenline",
    contactName: "Rana Khaled",
    serviceLine: "Brand retainer and paid social",
    owner: "Omar Nasser",
    source: ClientSource.REFERRAL,
    stage: PipelineStage.FOLLOW_UP,
    stageTone: "warning",
    estimatedValue: 42000,
    openedAt: "Aug 2, 2026",
    openedDaysAgo: 6,
    lastContact: "Yesterday, 15:20",
    nextFollowUp: "Aug 10, 2026",
    nextStep: "Finalize pricing objections before approval call.",
    proposalStatus: ProposalStatus.SENT,
    proposalTone: "warning",
    contractState: "Waiting for CRM approval",
    contractTone: "attention",
    agingLabel: "6d in pipeline",
    agingTone: "neutral",
    waitingApproval: true,
    stalled: false,
  },
  {
    id: "order-al-noor-launch",
    companyName: "Al Noor",
    contactName: "Majed Al Noor",
    serviceLine: "Launch campaign and content production",
    owner: "Mona Saleh",
    source: ClientSource.WHATSAPP,
    stage: PipelineStage.PROPOSAL_SENT,
    stageTone: "attention",
    estimatedValue: 28000,
    openedAt: "Jul 29, 2026",
    openedDaysAgo: 10,
    lastContact: "Today, 09:40",
    nextFollowUp: "Aug 9, 2026",
    nextStep: "Review proposal feedback and prepare revision scope.",
    proposalStatus: ProposalStatus.REVISION_REQUESTED,
    proposalTone: "attention",
    contractState: "Not started",
    contractTone: "neutral",
    agingLabel: "2d in current stage",
    agingTone: "neutral",
    waitingApproval: false,
    stalled: false,
  },
  {
    id: "order-riyadh-clinics-growth",
    companyName: "Riyadh Clinics",
    contactName: "Lama Nasser",
    serviceLine: "Lead generation and landing pages",
    owner: "Omar Nasser",
    source: ClientSource.WEBSITE,
    stage: PipelineStage.MEETING_SCHEDULED,
    stageTone: "active",
    estimatedValue: 18000,
    openedAt: "Aug 4, 2026",
    openedDaysAgo: 4,
    lastContact: "Today, 11:10",
    nextFollowUp: "Aug 11, 2026",
    nextStep: "Hold discovery meeting with decision makers.",
    proposalStatus: null,
    proposalTone: "neutral",
    contractState: "Not started",
    contractTone: "neutral",
    agingLabel: "Fresh opportunity",
    agingTone: "success",
    waitingApproval: false,
    stalled: false,
  },
  {
    id: "order-enterprise-foods-rebrand",
    companyName: "Enterprise Foods",
    contactName: "Salem Harbi",
    serviceLine: "Rebrand and trade marketing assets",
    owner: "Mona Saleh",
    source: ClientSource.PLATFORM,
    stage: PipelineStage.APPROVED,
    stageTone: "success",
    estimatedValue: 54000,
    openedAt: "Jul 18, 2026",
    openedDaysAgo: 21,
    lastContact: "Yesterday, 17:35",
    nextFollowUp: "Aug 8, 2026",
    nextStep: "Issue contract package for legal sign-off.",
    proposalStatus: ProposalStatus.APPROVED,
    proposalTone: "success",
    contractState: "Drafting contract package",
    contractTone: "warning",
    agingLabel: "Approval completed",
    agingTone: "success",
    waitingApproval: true,
    stalled: false,
  },
  {
    id: "order-oasis-retail-loyalty",
    companyName: "Oasis Retail",
    contactName: "Dina Faris",
    serviceLine: "Loyalty campaign and store activation",
    owner: "Omar Nasser",
    source: ClientSource.AD,
    stage: PipelineStage.CALL_ATTEMPT,
    stageTone: "attention",
    estimatedValue: 12000,
    openedAt: "Jul 12, 2026",
    openedDaysAgo: 27,
    lastContact: "Jul 28, 2026",
    nextFollowUp: "Overdue since Aug 1, 2026",
    nextStep: "Recover contact with procurement and confirm budget owner.",
    proposalStatus: null,
    proposalTone: "neutral",
    contractState: "Not started",
    contractTone: "neutral",
    agingLabel: "Follow-up overdue",
    agingTone: "destructive",
    waitingApproval: false,
    stalled: true,
  },
  {
    id: "order-northstar-seasonal",
    companyName: "Northstar",
    contactName: "Abeer Adel",
    serviceLine: "Seasonal social content package",
    owner: "Mona Saleh",
    source: ClientSource.REFERRAL,
    stage: PipelineStage.NEW,
    stageTone: "neutral",
    estimatedValue: 9000,
    openedAt: "Aug 7, 2026",
    openedDaysAgo: 1,
    lastContact: "No contact yet",
    nextFollowUp: "Today",
    nextStep: "Send qualification intro and capture brief.",
    proposalStatus: null,
    proposalTone: "neutral",
    contractState: "Not started",
    contractTone: "neutral",
    agingLabel: "1d in pipeline",
    agingTone: "success",
    waitingApproval: false,
    stalled: false,
  },
  {
    id: "order-pulse-crm-rollout",
    companyName: "Pulse Health",
    contactName: "Hussam Baker",
    serviceLine: "CRM rollout and automation setup",
    owner: "Omar Nasser",
    source: ClientSource.WEBSITE,
    stage: PipelineStage.MEETING_DONE,
    stageTone: "active",
    estimatedValue: 33000,
    openedAt: "Jul 25, 2026",
    openedDaysAgo: 14,
    lastContact: "Aug 6, 2026",
    nextFollowUp: "Aug 10, 2026",
    nextStep: "Draft scoped proposal after workshop notes sign-off.",
    proposalStatus: ProposalStatus.DRAFT,
    proposalTone: "neutral",
    contractState: "Not started",
    contractTone: "neutral",
    agingLabel: "Proposal prep in progress",
    agingTone: "warning",
    waitingApproval: false,
    stalled: false,
  },
  {
    id: "order-safa-logistics-retainer",
    companyName: "Safa Logistics",
    contactName: "Nour Fathy",
    serviceLine: "Employer brand and hiring funnel support",
    owner: "Mona Saleh",
    source: ClientSource.WHATSAPP,
    stage: PipelineStage.CONTRACT_SIGNED,
    stageTone: "success",
    estimatedValue: 61000,
    openedAt: "Jun 30, 2026",
    openedDaysAgo: 39,
    lastContact: "Yesterday, 13:15",
    nextFollowUp: "Handoff to project setup",
    nextStep: "Create project after finance confirms first payment.",
    proposalStatus: ProposalStatus.APPROVED,
    proposalTone: "success",
    contractState: "Signed, awaiting project creation",
    contractTone: "success",
    agingLabel: "Ready for conversion",
    agingTone: "success",
    waitingApproval: false,
    stalled: false,
  },
];

export const orderDirectoryRecords: OrderDirectoryRecord[] = orderDirectorySeed.map(
  (row) => ({
    ...row,
    contactAttemptCount:
      row.stage === PipelineStage.NEW
        ? 0
        : row.stage === PipelineStage.CALL_ATTEMPT
          ? 3
          : row.stage === PipelineStage.MEETING_SCHEDULED
            ? 2
            : 4,
    meetingsCount:
      row.stage === PipelineStage.MEETING_SCHEDULED ||
      row.stage === PipelineStage.MEETING_DONE ||
      row.stage === PipelineStage.APPROVED ||
      row.stage === PipelineStage.CONTRACT_SIGNED
        ? 1
        : 0,
    projectSignalLabel:
      row.stage === PipelineStage.CONTRACT_SIGNED
        ? "Ready for delivery handoff"
        : row.stage === PipelineStage.APPROVED
          ? "Commercial handoff pending"
          : "No project yet",
    projectSignalTone:
      row.stage === PipelineStage.CONTRACT_SIGNED ||
      row.stage === PipelineStage.APPROVED
        ? "active"
        : "neutral",
  }),
);

export function formatOrderCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatOrderStage(stage: PipelineStage) {
  return PIPELINE_UI_MAP[stage];
}

export function formatOrderSource(source: ClientSource) {
  return sourceLabels[source];
}

export function formatProposalStatus(status: ProposalStatus | null) {
  if (!status) return "Not started";
  return proposalLabels[status];
}

export function getFilteredOrders(
  statusFilter: OrderDirectoryFilter,
  dateFilter: OrderDateFilter,
  valueFilter: OrderValueFilter
) {
  return orderDirectoryRecords
    .filter((row) => row.stage !== PipelineStage.CONTRACT_SIGNED)
    .filter((row) => {
      if (statusFilter === "active") {
        return !row.waitingApproval && !row.stalled;
      }

      if (statusFilter === "waiting-approval") {
        return row.waitingApproval;
      }

      if (statusFilter === "stalled") {
        return row.stalled;
      }

      return true;
    })
    .filter((row) => {
      if (dateFilter === "last-7-days") return row.openedDaysAgo <= 7;
      if (dateFilter === "last-30-days") return row.openedDaysAgo <= 30;
      if (dateFilter === "last-90-days") return row.openedDaysAgo <= 90;
      return true;
    })
    .filter((row) => {
      if (valueFilter === "under-15000") return row.estimatedValue < 15000;
      if (valueFilter === "15000-30000") {
        return row.estimatedValue >= 15000 && row.estimatedValue < 30000;
      }
      if (valueFilter === "30000-50000") {
        return row.estimatedValue >= 30000 && row.estimatedValue < 50000;
      }
      if (valueFilter === "50000-plus") return row.estimatedValue >= 50000;
      return true;
    })
    .toSorted((left, right) => right.estimatedValue - left.estimatedValue);
}
