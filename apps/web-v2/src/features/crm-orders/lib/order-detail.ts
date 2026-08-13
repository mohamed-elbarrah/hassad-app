import {
  BusinessType,
  ClientSource,
  ContactLogResult,
  ContactLogType,
  PIPELINE_STAGE_ORDER,
  PIPELINE_UI_MAP,
  PipelineStage,
  ProposalStatus,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import {
  formatOrderCurrency,
  formatOrderSource,
  formatProposalStatus,
  orderDirectoryRecords,
  type OrderDirectoryRecord,
} from "@/features/crm-orders/lib/order-directory";

export type OrderDetailMetric = {
  label: string;
  value: string;
  description: string;
  trend?: {
    label: string;
    tone: StatusTone;
  };
};

export type OrderTouchpointPoint = {
  label: string;
  calls: number;
  meetings: number;
  messages: number;
};

export type OrderTimelineEntry = {
  id: string;
  type: ContactLogType;
  result: ContactLogResult;
  happenedAt: string;
  owner: string;
  summary: string;
  report: string;
  nextAction: string;
};

export type OrderStageHistoryEntry = {
  id: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  changedAt: string;
  changedBy: string;
  note: string;
};

export type OrderNoteHistoryEntry = {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  isInternal: boolean;
};

export type OrderRelatedProposal = {
  id: string;
  title: string;
  status: ProposalStatus;
  amount: number;
  createdAt: string;
  responseSignal: string;
};

export type OrderRelatedRecord = {
  label: string;
  value: string;
  helper: string;
};

export type OrderClientSnapshot = {
  id: string;
  companyName: string;
  contactName: string;
  status: "Client" | "Lead";
  owner: string;
  lastSeen: string;
};

export type OrderDetailRecord = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  businessName: string;
  businessType: BusinessType;
  source: ClientSource;
  owner: string;
  openedAt: string;
  lastContact: string;
  nextFollowUp: string;
  stage: PipelineStage;
  stageTone: StatusTone;
  estimatedValue: number;
  notes: string;
  serviceLine: string;
  statusSummary: string;
  sidebarSummary: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
  client: OrderClientSnapshot | null;
  metrics: OrderDetailMetric[];
  touchpoints: OrderTouchpointPoint[];
  contactTimeline: OrderTimelineEntry[];
  stageHistory: OrderStageHistoryEntry[];
  proposals: OrderRelatedProposal[];
  noteHistory?: OrderNoteHistoryEntry[];
  relatedRecords: OrderRelatedRecord[];
};

const businessTypeLabels: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "Restaurant",
  [BusinessType.CLINIC]: "Clinic",
  [BusinessType.STORE]: "Retail",
  [BusinessType.SERVICE]: "Service business",
  [BusinessType.OTHER]: "Other",
};

const contactTypeLabels: Record<ContactLogType, string> = {
  [ContactLogType.CALL]: "Call",
  [ContactLogType.WHATSAPP]: "WhatsApp",
  [ContactLogType.MEETING]: "Meeting",
  [ContactLogType.EMAIL]: "Email",
};

const contactResultLabels: Record<ContactLogResult, string> = {
  [ContactLogResult.NO_RESPONSE]: "No response",
  [ContactLogResult.RESPONDED]: "Responded",
  [ContactLogResult.BUSY]: "Busy",
  [ContactLogResult.WRONG_NUMBER]: "Wrong number",
  [ContactLogResult.NOT_INTERESTED]: "Not interested",
};

function findDirectoryRecord(id: string) {
  return orderDirectoryRecords.find((record) => record.id === id);
}

function getStageProgressValue(stage: PipelineStage) {
  const currentIndex = PIPELINE_STAGE_ORDER.indexOf(stage);
  const lastIndex = PIPELINE_STAGE_ORDER.length - 1;

  if (currentIndex < 0 || lastIndex <= 0) {
    return "0%";
  }

  return `${Math.round((currentIndex / lastIndex) * 100)}%`;
}

function buildFallbackOrderDetail(record: OrderDirectoryRecord): OrderDetailRecord {
  return {
    id: record.id,
    companyName: record.companyName,
    contactName: record.contactName,
    phone: "+966 55 000 0000",
    email: `${record.companyName.toLowerCase().replaceAll(" ", "")}@example.com`,
    businessName: `${record.companyName} Group`,
    businessType: BusinessType.SERVICE,
    source: record.source as ClientSource,
    owner: record.owner,
    openedAt: record.openedAt,
    lastContact: record.lastContact,
    nextFollowUp: record.nextFollowUp,
    stage: record.stage,
    stageTone: record.stageTone,
    estimatedValue: record.estimatedValue,
    notes: record.nextStep,
    serviceLine: record.serviceLine,
    statusSummary:
      record.stalled
        ? "This order needs recovery because follow-up discipline slipped."
        : record.waitingApproval
          ? "The order is commercially active but waiting on a decision before it can move forward."
          : "The order is moving normally through the CRM pipeline.",
    sidebarSummary: [
      {
        label: "Contact attempts",
        value: String(Math.max(record.openedDaysAgo > 14 ? 4 : 2, 2)),
        helper: "Derived from the CRM order timeline until API data is connected.",
      },
      {
        label: "Latest proposal",
        value: formatProposalStatus(record.proposalStatus),
        helper: "Proposal state carried from the directory record.",
      },
      {
        label: "Client relation",
        value: record.stage === PipelineStage.CONTRACT_SIGNED ? "Existing client" : "Lead only",
        helper: "Linked-client state will come from the API transport later.",
      },
      {
        label: "Pipeline age",
        value: `${record.openedDaysAgo} days`,
        helper: "Measured from the original order opening date.",
      },
    ],
    client:
      record.stage === PipelineStage.CONTRACT_SIGNED
        ? {
            id: `${record.id}-client`,
            companyName: record.companyName,
            contactName: record.contactName,
            status: "Client",
            owner: record.owner,
            lastSeen: "Online now",
          }
        : null,
    metrics: [
      {
        label: "Current stage",
        value: PIPELINE_UI_MAP[record.stage],
        description: "Current pipeline stage from the CRM directory.",
        trend: record.stalled
          ? { label: "Recovery needed", tone: "destructive" }
          : record.waitingApproval
            ? { label: "Waiting decision", tone: "warning" }
            : undefined,
      },
      {
        label: "Estimated value",
        value: formatOrderCurrency(record.estimatedValue),
        description: "Commercial value expected from this order.",
      },
      {
        label: "Last contact",
        value: record.lastContact,
        description: "Latest recorded touchpoint from CRM.",
      },
      {
        label: "Stage progress",
        value: getStageProgressValue(record.stage),
        description: "Progress across the standard CRM pipeline.",
      },
    ],
    touchpoints: [
      { label: "Week 1", calls: 1, meetings: 0, messages: 1 },
      { label: "Week 2", calls: 1, meetings: 1, messages: 1 },
      { label: "Week 3", calls: 1, meetings: 0, messages: 2 },
      { label: "Week 4", calls: 1, meetings: 0, messages: 1 },
    ],
    contactTimeline: [
      {
        id: `${record.id}-contact-1`,
        type: ContactLogType.CALL,
        result: record.stalled ? ContactLogResult.NO_RESPONSE : ContactLogResult.RESPONDED,
        happenedAt: record.lastContact,
        owner: record.owner,
        summary: "Latest CRM follow-up",
        report: record.nextStep,
        nextAction: record.nextFollowUp,
      },
      {
        id: `${record.id}-contact-2`,
        type: ContactLogType.WHATSAPP,
        result: ContactLogResult.RESPONDED,
        happenedAt: record.openedAt,
        owner: record.owner,
        summary: "Qualification outreach",
        report: `${record.contactName} was qualified for ${record.serviceLine.toLowerCase()}.`,
        nextAction: `Move from ${PIPELINE_UI_MAP[record.stage]} when the next decision is captured.`,
      },
    ],
    stageHistory: [
      {
        id: `${record.id}-stage-1`,
        fromStage: PipelineStage.NEW,
        toStage: record.stage,
        changedAt: record.openedAt,
        changedBy: record.owner,
        note: `Order currently sits in ${PIPELINE_UI_MAP[record.stage]}.`,
      },
    ],
    noteHistory: [
      {
        id: `${record.id}-note-1`,
        content: record.nextStep,
        createdAt: record.lastContact,
        author: record.owner,
        isInternal: true,
      },
    ],
    proposals: record.proposalStatus
      ? [
          {
            id: `${record.id}-proposal`,
            title: `${record.companyName} commercial package`,
            status: record.proposalStatus,
            amount: record.estimatedValue,
            createdAt: record.openedAt,
            responseSignal: record.agingLabel,
          },
        ]
      : [],
    relatedRecords: [
      {
        label: "Requested services",
        value: record.serviceLine,
        helper: "Service scope carried from the Orders list.",
      },
      {
        label: "Primary blocker",
        value: record.nextStep,
        helper: "The current commercial action needed to move the order.",
      },
      {
        label: "Request origin",
        value: formatOrderSource(record.source as ClientSource),
        helper: "Lead source recorded at CRM intake.",
      },
    ],
  };
}

const orderDetailRecords: OrderDetailRecord[] = [
  {
    id: "order-greenline-brand-retainer",
    companyName: "Greenline",
    contactName: "Rana Khaled",
    phone: "+966 55 038 2140",
    email: "rana@greenline.sa",
    businessName: "Greenline Trading",
    businessType: BusinessType.STORE,
    source: ClientSource.REFERRAL,
    owner: "Omar Nasser",
    openedAt: "Aug 2, 2026",
    lastContact: "Yesterday, 15:20",
    nextFollowUp: "Aug 10, 2026",
    stage: PipelineStage.FOLLOW_UP,
    stageTone: "warning",
    estimatedValue: 42000,
    notes:
      "The client approved the strategic direction and pricing range, but procurement needs a final services breakdown before legal review starts.",
    serviceLine: "Brand retainer and paid social",
    statusSummary:
      "Commercially healthy, but still waiting on a final approval call from procurement.",
    sidebarSummary: [
      {
        label: "Contact attempts",
        value: "6",
        helper: "Calls, WhatsApp follow-ups, and one review meeting",
      },
      {
        label: "Latest proposal",
        value: "Sent",
        helper: "Revision-free proposal currently under review",
      },
      {
        label: "Client relation",
        value: "Existing client",
        helper: "Already linked to a live client account",
      },
      {
        label: "Pipeline age",
        value: "6 days",
        helper: "Still moving within the expected negotiation window",
      },
    ],
    client: {
      id: "client-greenline",
      companyName: "Greenline",
      contactName: "Rana Khaled",
      status: "Client",
      owner: "Omar Nasser",
      lastSeen: "Online now",
    },
    metrics: [
      {
        label: "Current stage",
        value: PIPELINE_UI_MAP[PipelineStage.FOLLOW_UP],
        description: "Post-proposal negotiation is active.",
        trend: { label: "Needs decision", tone: "warning" },
      },
      {
        label: "Estimated value",
        value: formatOrderCurrency(42000),
        description: "Potential contract value if approval closes this cycle.",
      },
      {
        label: "Last contact",
        value: "Yesterday",
        description: "Most recent touchpoint came from a pricing review call.",
      },
      {
        label: "Stage progress",
        value: getStageProgressValue(PipelineStage.FOLLOW_UP),
        description: "This order is late-stage and close to commercial close.",
      },
    ],
    touchpoints: [
      { label: "Week 1", calls: 2, meetings: 0, messages: 1 },
      { label: "Week 2", calls: 1, meetings: 1, messages: 2 },
      { label: "Week 3", calls: 1, meetings: 0, messages: 2 },
      { label: "Week 4", calls: 1, meetings: 1, messages: 1 },
    ],
    contactTimeline: [
      {
        id: "greenline-contact-1",
        type: ContactLogType.CALL,
        result: ContactLogResult.RESPONDED,
        happenedAt: "Aug 7, 2026 · 15:20",
        owner: "Omar Nasser",
        summary: "Pricing review call",
        report:
          "Reviewed retainer pricing with procurement. They accepted the scope but asked for a line-level split between paid social and reporting.",
        nextAction: "Send priced breakdown before the approval call on Aug 10.",
      },
      {
        id: "greenline-contact-2",
        type: ContactLogType.WHATSAPP,
        result: ContactLogResult.RESPONDED,
        happenedAt: "Aug 5, 2026 · 10:05",
        owner: "Omar Nasser",
        summary: "Follow-up on decision timeline",
        report:
          "Client confirmed legal and procurement are aligned, but final internal sign-off will only happen after receiving the revised pricing split.",
        nextAction: "Prepare revised pricing sheet.",
      },
      {
        id: "greenline-contact-3",
        type: ContactLogType.MEETING,
        result: ContactLogResult.RESPONDED,
        happenedAt: "Aug 3, 2026 · 13:00",
        owner: "Omar Nasser",
        summary: "Commercial review meeting",
        report:
          "Walked through the quarterly growth targets, approval path, and paid social scope. Stakeholders asked for a 30-day launch plan.",
        nextAction: "Attach launch plan to the proposal package.",
      },
    ],
    stageHistory: [
      {
        id: "greenline-stage-1",
        fromStage: PipelineStage.PROPOSAL_SENT,
        toStage: PipelineStage.FOLLOW_UP,
        changedAt: "Aug 4, 2026",
        changedBy: "Omar Nasser",
        note: "Proposal was opened and the client requested a pricing review call.",
      },
      {
        id: "greenline-stage-2",
        fromStage: PipelineStage.MEETING_DONE,
        toStage: PipelineStage.PROPOSAL_SENT,
        changedAt: "Aug 3, 2026",
        changedBy: "Omar Nasser",
        note: "Proposal sent after the commercial review meeting.",
      },
      {
        id: "greenline-stage-3",
        fromStage: PipelineStage.MEETING_SCHEDULED,
        toStage: PipelineStage.MEETING_DONE,
        changedAt: "Aug 2, 2026",
        changedBy: "Omar Nasser",
        note: "Discovery and pricing review completed with decision makers.",
      },
    ],
    proposals: [
      {
        id: "proposal-greenline-q3-retainer",
        title: "Q3 retainer and paid social package",
        status: ProposalStatus.SENT,
        amount: 42000,
        createdAt: "Aug 3, 2026",
        responseSignal: "Opened Aug 4",
      },
    ],
    relatedRecords: [
      {
        label: "Requested services",
        value: "Paid social, content reporting, monthly strategy review",
        helper: "Scope that commercial is currently negotiating.",
      },
      {
        label: "Primary blocker",
        value: "Procurement needs final pricing split",
        helper: "No legal hold yet; the blocker is commercial clarity.",
      },
      {
        label: "Request origin",
        value: formatOrderSource(ClientSource.REFERRAL),
        helper: "Entered CRM through partner referral, not portal intake.",
      },
    ],
  },
  {
    id: "order-al-noor-launch",
    companyName: "Al Noor",
    contactName: "Majed Al Noor",
    phone: "+966 50 922 7714",
    email: "majed@alnoor.sa",
    businessName: "Al Noor Foods",
    businessType: BusinessType.RESTAURANT,
    source: ClientSource.WHATSAPP,
    owner: "Mona Saleh",
    openedAt: "Jul 29, 2026",
    lastContact: "Today, 09:40",
    nextFollowUp: "Aug 9, 2026",
    stage: PipelineStage.PROPOSAL_SENT,
    stageTone: "attention",
    estimatedValue: 28000,
    notes:
      "The client requested proposal revisions around launch content volume and campaign timing before they move to approval.",
    serviceLine: "Launch campaign and content production",
    statusSummary:
      "Proposal is live, but revision pressure is high and needs a controlled follow-up loop.",
    sidebarSummary: [
      {
        label: "Contact attempts",
        value: "5",
        helper: "One meeting, two calls, two WhatsApp follow-ups",
      },
      {
        label: "Latest proposal",
        value: "Revision requested",
        helper: "Client asked for updated campaign scope",
      },
      {
        label: "Client relation",
        value: "Lead only",
        helper: "No converted client account yet",
      },
      {
        label: "Pipeline age",
        value: "10 days",
        helper: "Healthy for a proposal revision cycle",
      },
    ],
    client: null,
    metrics: [
      {
        label: "Current stage",
        value: PIPELINE_UI_MAP[PipelineStage.PROPOSAL_SENT],
        description: "Proposal is sent and being revised with the client.",
        trend: { label: "Revision cycle", tone: "attention" },
      },
      {
        label: "Estimated value",
        value: formatOrderCurrency(28000),
        description: "Expected value after scope confirmation.",
      },
      {
        label: "Last contact",
        value: "Today",
        description: "Most recent touchpoint covered revision notes.",
      },
      {
        label: "Stage progress",
        value: getStageProgressValue(PipelineStage.PROPOSAL_SENT),
        description: "The order is moving toward negotiation and approval.",
      },
    ],
    touchpoints: [
      { label: "Week 1", calls: 1, meetings: 1, messages: 1 },
      { label: "Week 2", calls: 2, meetings: 0, messages: 1 },
      { label: "Week 3", calls: 1, meetings: 0, messages: 2 },
      { label: "Week 4", calls: 1, meetings: 0, messages: 1 },
    ],
    contactTimeline: [
      {
        id: "alnoor-contact-1",
        type: ContactLogType.CALL,
        result: ContactLogResult.RESPONDED,
        happenedAt: "Aug 8, 2026 · 09:40",
        owner: "Mona Saleh",
        summary: "Revision alignment call",
        report:
          "Client wants the launch package to front-load production in the first two weeks and reduce influencer support in exchange for more retail content.",
        nextAction: "Send revised scope and adjusted delivery calendar.",
      },
      {
        id: "alnoor-contact-2",
        type: ContactLogType.WHATSAPP,
        result: ContactLogResult.RESPONDED,
        happenedAt: "Aug 6, 2026 · 17:20",
        owner: "Mona Saleh",
        summary: "Proposal markup received",
        report:
          "Client shared markup notes directly on pricing and requested optional add-ons to be removed from the main package.",
        nextAction: "Publish clean version of the proposal.",
      },
      {
        id: "alnoor-contact-3",
        type: ContactLogType.MEETING,
        result: ContactLogResult.RESPONDED,
        happenedAt: "Jul 31, 2026 · 12:30",
        owner: "Mona Saleh",
        summary: "Discovery meeting",
        report:
          "The founder confirmed the launch window and asked for campaign assets tied to menu rollout and retail activation.",
        nextAction: "Keep messaging focused on launch conversion, not awareness.",
      },
    ],
    stageHistory: [
      {
        id: "alnoor-stage-1",
        fromStage: PipelineStage.MEETING_DONE,
        toStage: PipelineStage.PROPOSAL_SENT,
        changedAt: "Aug 2, 2026",
        changedBy: "Mona Saleh",
        note: "Proposal issued after discovery notes were approved internally.",
      },
      {
        id: "alnoor-stage-2",
        fromStage: PipelineStage.MEETING_SCHEDULED,
        toStage: PipelineStage.MEETING_DONE,
        changedAt: "Jul 31, 2026",
        changedBy: "Mona Saleh",
        note: "Launch workshop held with founder and marketing lead.",
      },
      {
        id: "alnoor-stage-3",
        fromStage: PipelineStage.INTRO_SENT,
        toStage: PipelineStage.MEETING_SCHEDULED,
        changedAt: "Jul 30, 2026",
        changedBy: "Mona Saleh",
        note: "Meeting confirmed after WhatsApp qualification.",
      },
    ],
    proposals: [
      {
        id: "proposal-alnoor-launch-v2",
        title: "Launch campaign and content production",
        status: ProposalStatus.REVISION_REQUESTED,
        amount: 28000,
        createdAt: "Aug 2, 2026",
        responseSignal: "Revisions requested Aug 6",
      },
    ],
    relatedRecords: [
      {
        label: "Requested services",
        value: "Launch assets, campaign management, retail content production",
        helper: "Revisions are focused on packaging and timing, not service fit.",
      },
      {
        label: "Primary blocker",
        value: "Client wants new production mix before approval",
        helper: "Commercial issue is scope balance rather than budget rejection.",
      },
      {
        label: "Request origin",
        value: formatOrderSource(ClientSource.WHATSAPP),
        helper: "Lead was created directly by the CRM team after inbound contact.",
      },
    ],
  },
];

export function getOrderDetailById(id: string) {
  const detail = orderDetailRecords.find((record) => record.id === id);

  if (detail) {
    return detail;
  }

  const directoryRecord = findDirectoryRecord(id);
  if (!directoryRecord) {
    return null;
  }

  return buildFallbackOrderDetail(directoryRecord);
}

export function getOrderDirectorySummary(id: string): OrderDirectoryRecord | null {
  return findDirectoryRecord(id) ?? null;
}

export function formatBusinessType(type: BusinessType) {
  return businessTypeLabels[type];
}

export function formatContactLogType(type: ContactLogType) {
  return contactTypeLabels[type];
}

export function formatContactLogResult(result: ContactLogResult) {
  return contactResultLabels[result];
}

export function formatPipelineStage(stage: PipelineStage) {
  return PIPELINE_UI_MAP[stage];
}

export function formatProposalResponse(status: ProposalStatus) {
  return formatProposalStatus(status);
}

export function formatClientRelationship(client: OrderClientSnapshot | null) {
  if (!client) {
    return "Lead only";
  }

  return `${client.status} account linked`;
}
