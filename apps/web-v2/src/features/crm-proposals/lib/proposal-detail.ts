import { ProposalStatus } from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import {
  formatProposalCurrency,
  formatProposalStatus,
  proposalDirectoryRecords,
  type ProposalDirectoryRecord,
} from "@/features/crm-proposals/lib/proposal-directory";

export type ProposalDetailMetric = {
  label: string;
  value: string;
  description: string;
  trend?: {
    label: string;
    tone: StatusTone;
  };
};

export type ProposalServiceRow = {
  id: string;
  service: string;
  scope: string;
  quantity: string;
  amount: number;
};

export type ProposalRevisionEntry = {
  id: string;
  date: string;
  title: string;
  actor: string;
  note: string;
  status: ProposalStatus;
  completed?: boolean;
};

export type ProposalContextRow = {
  label: string;
  value: string;
  helper: string;
};

export type ProposalLinkedRecord = {
  label: string;
  value: string;
  href?: string;
  tone?: StatusTone;
};

export type ProposalDetailRecord = {
  id: string;
  title: string;
  clientName: string;
  requestName: string;
  creator: string;
  owner: string;
  status: ProposalStatus;
  statusTone: StatusTone;
  totalValue: number;
  sentLabel: string;
  validUntilLabel: string;
  responseLabel: string;
  document: {
    fileName: string;
    version: string;
    generatedAt: string;
    openHref: string;
  };
  sidebarFacts: Array<{
    label: string;
    value: string;
  }>;
  metrics: ProposalDetailMetric[];
  services: ProposalServiceRow[];
  revisionHistory: ProposalRevisionEntry[];
  commercialContext: ProposalContextRow[];
  linkedRecords: ProposalLinkedRecord[];
};

function buildFallbackProposalDetail(
  record: ProposalDirectoryRecord,
): ProposalDetailRecord {
  const defaultTrend =
    record.status === ProposalStatus.APPROVED
      ? { label: "Contract ready", tone: "success" as const }
      : record.status === ProposalStatus.REVISION_REQUESTED
        ? { label: "Needs revision", tone: "attention" as const }
        : record.status === ProposalStatus.REJECTED
          ? { label: "Closed", tone: "destructive" as const }
          : record.status === ProposalStatus.SENT
            ? { label: "Awaiting reply", tone: "warning" as const }
            : undefined;

  return {
    id: record.id,
    title: record.title,
    clientName: record.clientName,
    requestName: record.requestName,
    creator: record.creator,
    owner: record.creator,
    status: record.status,
    statusTone: record.statusTone,
    totalValue: record.totalValue,
    sentLabel: record.sentAtLabel,
    validUntilLabel: record.validUntilLabel,
    responseLabel: record.responseLabel,
    document: {
      fileName: `${record.title.toLowerCase().replaceAll(" ", "-")}.pdf`,
      version: "v1",
      generatedAt: record.sentAtLabel === "Not sent" ? "Draft only" : record.sentAtLabel,
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: record.clientName },
      { label: "Request", value: record.requestName },
      { label: "Prepared by", value: record.creator },
      { label: "Services", value: `${record.servicesCount}` },
      { label: "Sent", value: record.sentAtLabel },
      { label: "Validity", value: record.validUntilLabel },
    ],
    metrics: [
      {
        label: "Proposal value",
        value: formatProposalCurrency(record.totalValue),
        description: "Commercial value of the current proposal version.",
      },
      {
        label: "Services",
        value: `${record.servicesCount}`,
        description: "Distinct service lines included in the proposal.",
      },
      {
        label: "Client response",
        value: record.responseLabel,
        description: "Latest decision signal from the client side.",
        trend: defaultTrend,
      },
      {
        label: "Contract state",
        value: record.contractLabel,
        description: "Whether the proposal has already progressed into contract work.",
      },
    ],
    services: [
      {
        id: `${record.id}-service-1`,
        service: record.servicesLabel.split(",")[0] ?? record.servicesLabel,
        scope: "Primary deliverable package",
        quantity: "1 package",
        amount: Math.round(record.totalValue * 0.45),
      },
      {
        id: `${record.id}-service-2`,
        service: record.servicesLabel.split(",")[1]?.trim() ?? "Execution support",
        scope: "Execution and optimization",
        quantity: "1 package",
        amount: Math.round(record.totalValue * 0.35),
      },
      {
        id: `${record.id}-service-3`,
        service: record.servicesLabel.split(",")[2]?.trim() ?? "Reporting",
        scope: "Reporting and handoff",
        quantity: "1 package",
        amount: record.totalValue - Math.round(record.totalValue * 0.45) - Math.round(record.totalValue * 0.35),
      },
    ],
    revisionHistory: [
      {
        id: `${record.id}-rev-1`,
        date: record.sentAtLabel,
        title: "Proposal prepared",
        actor: record.creator,
        note: "Commercial package prepared and aligned internally before client delivery.",
        status: ProposalStatus.DRAFT,
        completed: true,
      },
      {
        id: `${record.id}-rev-2`,
        date: record.sentAtLabel,
        title: "Proposal sent",
        actor: record.creator,
        note: record.responseLabel,
        status: record.status === ProposalStatus.DRAFT ? ProposalStatus.SENT : record.status,
        completed: record.status !== ProposalStatus.DRAFT,
      },
    ],
    commercialContext: [
      {
        label: "Approval signal",
        value: record.responseLabel,
        helper: "Latest commercial decision or feedback signal from the client.",
      },
      {
        label: "Contract readiness",
        value: record.contractLabel,
        helper: "Shows whether this proposal can move to the contract stage now.",
      },
      {
        label: "Commercial blocker",
        value:
          record.status === ProposalStatus.REVISION_REQUESTED
            ? "Revision request must be answered"
            : record.status === ProposalStatus.SENT
              ? "Client response still pending"
              : record.status === ProposalStatus.REJECTED
                ? "Commercial cycle closed"
                : "Ready for next commercial step",
        helper: "Main blocker preventing progression to the next stage.",
      },
    ],
    linkedRecords: [
      {
        label: "Order",
        value: record.requestName,
      },
      {
        label: "Client",
        value: record.clientName,
      },
      {
        label: "Contract",
        value: record.contractLabel,
        tone: record.contractTone,
      },
    ],
  };
}

const proposalDetailRecords: ProposalDetailRecord[] = [
  {
    id: "proposal-enterprise-foods-rebrand",
    title: "Enterprise Foods rebrand",
    clientName: "Enterprise Foods",
    requestName: "Rebrand and trade rollout",
    creator: "Mona Saleh",
    owner: "Mona Saleh",
    status: ProposalStatus.APPROVED,
    statusTone: "success",
    totalValue: 54000,
    sentLabel: "Sent 9d ago",
    validUntilLabel: "Valid until Aug 20, 2026",
    responseLabel: "Approved Aug 6",
    document: {
      fileName: "enterprise-foods-rebrand-v2.pdf",
      version: "v2",
      generatedAt: "Aug 5, 2026",
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: "Enterprise Foods" },
      { label: "Request", value: "Rebrand and trade rollout" },
      { label: "Prepared by", value: "Mona Saleh" },
      { label: "Sent", value: "Aug 1, 2026" },
      { label: "Valid until", value: "Aug 20, 2026" },
      { label: "Contract", value: "Ready for contract" },
    ],
    metrics: [
      {
        label: "Proposal value",
        value: formatProposalCurrency(54000),
        description: "Approved value of the commercial package.",
      },
      {
        label: "Services",
        value: "5",
        description: "Service lines included across strategy, design, and rollout.",
      },
      {
        label: "Revision rounds",
        value: "1",
        description: "Only one client correction cycle was needed.",
        trend: { label: "Low friction", tone: "success" },
      },
      {
        label: "Contract readiness",
        value: "Ready",
        description: "Commercial approval is complete and contract work can start.",
        trend: { label: "Approved", tone: "success" },
      },
    ],
    services: [
      {
        id: "enterprise-service-1",
        service: "Brand strategy",
        scope: "Brand architecture, positioning, and rollout planning",
        quantity: "1 package",
        amount: 14000,
      },
      {
        id: "enterprise-service-2",
        service: "Packaging system",
        scope: "Packaging direction, design system, and production files",
        quantity: "1 package",
        amount: 18000,
      },
      {
        id: "enterprise-service-3",
        service: "Trade rollout kit",
        scope: "Retail assets, launch collateral, and implementation support",
        quantity: "1 package",
        amount: 22000,
      },
    ],
    revisionHistory: [
      {
        id: "enterprise-rev-1",
        date: "Jul 29, 2026",
        title: "Proposal draft approved internally",
        actor: "Mona Saleh",
        note: "Commercial scope and pricing aligned before client delivery.",
        status: ProposalStatus.DRAFT,
        completed: true,
      },
      {
        id: "enterprise-rev-2",
        date: "Aug 1, 2026",
        title: "Proposal sent to client",
        actor: "Mona Saleh",
        note: "Client received the rebrand and rollout package for review.",
        status: ProposalStatus.SENT,
        completed: true,
      },
      {
        id: "enterprise-rev-3",
        date: "Aug 4, 2026",
        title: "Revision request received",
        actor: "Client team",
        note: "Client asked to separate packaging scope from in-store rollout milestones.",
        status: ProposalStatus.REVISION_REQUESTED,
        completed: true,
      },
      {
        id: "enterprise-rev-4",
        date: "Aug 5, 2026",
        title: "Revised version sent",
        actor: "Mona Saleh",
        note: "Pricing and milestone framing updated per commercial feedback.",
        status: ProposalStatus.SENT,
        completed: true,
      },
      {
        id: "enterprise-rev-5",
        date: "Aug 6, 2026",
        title: "Proposal approved",
        actor: "Client procurement",
        note: "Commercial approval complete. Contract package can now be prepared.",
        status: ProposalStatus.APPROVED,
        completed: true,
      },
    ],
    commercialContext: [
      {
        label: "Approval signal",
        value: "Approved by procurement and marketing lead",
        helper: "Commercial stakeholders aligned on both price and scope.",
      },
      {
        label: "Main blocker",
        value: "No commercial blocker",
        helper: "The next step is legal and contract packaging, not negotiation.",
      },
      {
        label: "Next step",
        value: "Generate contract package",
        helper: "Proposal is finished as a commercial document.",
      },
    ],
    linkedRecords: [
      { label: "Order", value: "Enterprise Foods rebrand order" },
      { label: "Client", value: "Enterprise Foods", href: "/admin/clients/client-enterprise-foods" },
      { label: "Contract", value: "Ready for contract", tone: "success" },
    ],
  },
  {
    id: "proposal-al-noor-launch",
    title: "Al Noor launch package",
    clientName: "Al Noor",
    requestName: "Launch campaign scope",
    creator: "Mona Saleh",
    owner: "Mona Saleh",
    status: ProposalStatus.REVISION_REQUESTED,
    statusTone: "attention",
    totalValue: 28000,
    sentLabel: "Sent 3d ago",
    validUntilLabel: "Valid until Aug 25, 2026",
    responseLabel: "Revision Aug 7",
    document: {
      fileName: "al-noor-launch-v1.pdf",
      version: "v1",
      generatedAt: "Aug 5, 2026",
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: "Al Noor" },
      { label: "Request", value: "Launch campaign scope" },
      { label: "Prepared by", value: "Mona Saleh" },
      { label: "Sent", value: "Aug 5, 2026" },
      { label: "Valid until", value: "Aug 25, 2026" },
      { label: "Contract", value: "Not created" },
    ],
    metrics: [
      {
        label: "Proposal value",
        value: formatProposalCurrency(28000),
        description: "Current value before revisions are resolved.",
      },
      {
        label: "Services",
        value: "3",
        description: "Campaign setup, content production, and reporting support.",
      },
      {
        label: "Revision rounds",
        value: "1",
        description: "The client has already asked for one revision pass.",
        trend: { label: "Open revision", tone: "attention" },
      },
      {
        label: "Contract readiness",
        value: "Blocked",
        description: "Contract work cannot start until the revised proposal is approved.",
        trend: { label: "Needs response", tone: "warning" },
      },
    ],
    services: [
      {
        id: "alnoor-service-1",
        service: "Campaign setup",
        scope: "Launch structure, targeting, and activation plan",
        quantity: "1 package",
        amount: 9000,
      },
      {
        id: "alnoor-service-2",
        service: "Content production",
        scope: "Launch assets and short-form campaign content",
        quantity: "1 package",
        amount: 12000,
      },
      {
        id: "alnoor-service-3",
        service: "Reporting and optimization",
        scope: "Performance reporting, weekly review, and optimization support",
        quantity: "1 package",
        amount: 7000,
      },
    ],
    revisionHistory: [
      {
        id: "alnoor-rev-1",
        date: "Aug 3, 2026",
        title: "Proposal prepared",
        actor: "Mona Saleh",
        note: "Scope aligned around launch assets, campaign setup, and reporting.",
        status: ProposalStatus.DRAFT,
        completed: true,
      },
      {
        id: "alnoor-rev-2",
        date: "Aug 5, 2026",
        title: "Proposal sent to client",
        actor: "Mona Saleh",
        note: "Commercial package delivered after discovery and internal scoping.",
        status: ProposalStatus.SENT,
        completed: true,
      },
      {
        id: "alnoor-rev-3",
        date: "Aug 7, 2026",
        title: "Revision requested",
        actor: "Client founder",
        note: "Client requested more retail-focused production and fewer optional campaign add-ons.",
        status: ProposalStatus.REVISION_REQUESTED,
        completed: true,
      },
    ],
    commercialContext: [
      {
        label: "Approval signal",
        value: "Client wants revised scope mix",
        helper: "Commercial issue is scope shape, not price rejection.",
      },
      {
        label: "Main blocker",
        value: "Revision response still pending",
        helper: "Proposal must be revised before a commercial decision can happen.",
      },
      {
        label: "Next step",
        value: "Send revised proposal with updated production allocation",
        helper: "This is the action that should move the proposal back to client review.",
      },
    ],
    linkedRecords: [
      { label: "Order", value: "Al Noor launch order", href: "/admin/crm/orders/order-al-noor-launch" },
      { label: "Client", value: "Al Noor" },
      { label: "Contract", value: "Not created", tone: "neutral" },
    ],
  },
];

export function getProposalDetailById(id: string) {
  const detail = proposalDetailRecords.find((record) => record.id === id);
  if (detail) return detail;

  const directoryRecord = proposalDirectoryRecords.find((record) => record.id === id);
  return directoryRecord ? buildFallbackProposalDetail(directoryRecord) : null;
}
