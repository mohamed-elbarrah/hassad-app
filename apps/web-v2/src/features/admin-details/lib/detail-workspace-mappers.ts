"use client";

import {
  BusinessType,
  ClientSource,
  ContractStatus,
  MeetingStatus,
  ProjectPeriodStatus,
  ProjectStatus,
  ProposalStatus,
  TaskDepartment,
  TaskPriority,
  TaskStatus,
  UserRole,
  type EmployeeWorkspaceRecord,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import type { ClientDetailRecord } from "@/features/clients/lib/client-detail";
import type { ClientDirectoryRecord } from "@/features/clients/lib/client-directory";
import type { ContractDetailRecord } from "@/features/crm-contracts/lib/contract-detail";
import type { ContractPaymentRow } from "@/features/crm-contracts/lib/contract-detail";
import type { OrderDetailRecord } from "@/features/crm-orders/lib/order-detail";
import type { ProposalDetailRecord } from "@/features/crm-proposals/lib/proposal-detail";
import type { DisputeDetailRecord } from "@/features/disputes/lib/dispute-detail";
import type { EmployeeAdminRecord } from "@/features/employees/lib/employee-admin";
import type { ProjectDetailFinanceRow, ProjectDetailHistoryRow, ProjectDetailPeriodRow, ProjectDetailRecord, ProjectDetailTeamRow } from "@/features/projects/lib/project-detail";
import type { TaskDirectoryRecord } from "@/features/tasks/lib/task-directory";
import type { TaskDetailRecord } from "@/features/tasks/lib/task-detail";
import type { EmployeeFixture } from "@/lib/fixtures/first-slice";

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(amount?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function buildInitials(name?: string | null) {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function diffDays(target?: string | Date | null) {
  if (!target) return null;
  const date = new Date(target);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date("2026-08-09T00:00:00Z");
  const targetUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return Math.round((targetUtc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDueLabel(target?: string | Date | null) {
  const days = diffDays(target);
  if (days === null) return "No due date";
  if (days === 0) return "Today";
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  return formatDate(target);
}

function mapClientStage(status?: string | null, activeProjects = 0): ClientDirectoryRecord["stage"] {
  if (status === "LEAD") return "lead";
  if (activeProjects > 0) return "active";
  return "completed";
}

function mapClientTypeTone(stage: ClientDirectoryRecord["stage"]): StatusTone {
  if (stage === "active") return "active";
  if (stage === "lead") return "attention";
  return "neutral";
}

function mapFinanceTone(outstanding: number): StatusTone {
  if (outstanding > 0) return "warning";
  return "success";
}

function mapProposalTone(status?: ProposalStatus | string | null): StatusTone {
  if (status === ProposalStatus.APPROVED || status === "APPROVED") return "success";
  if (status === ProposalStatus.REJECTED || status === "REJECTED") return "destructive";
  if (status === ProposalStatus.REVISION_REQUESTED || status === "REVISION_REQUESTED") return "attention";
  if (status === ProposalStatus.SENT || status === "SENT") return "warning";
  return "neutral";
}

function mapContractTone(status?: ContractStatus | string | null): StatusTone {
  if (status === ContractStatus.ACTIVE || status === "ACTIVE" || status === "SIGNED") return "success";
  if (status === ContractStatus.CANCELLED || status === "CANCELLED" || status === "EXPIRED") return "destructive";
  if (status === "ON_HOLD") return "attention";
  if (status === "SENT") return "warning";
  return "neutral";
}

function mapProjectTone(status?: ProjectStatus | string | null): StatusTone {
  if (status === ProjectStatus.ACTIVE || status === "ACTIVE") return "active";
  if (status === ProjectStatus.COMPLETED || status === "COMPLETED") return "success";
  if (status === ProjectStatus.NEEDS_REVISION || status === "NEEDS_REVISION") return "attention";
  if (status === ProjectStatus.ON_HOLD || status === "ON_HOLD") return "warning";
  return "neutral";
}

function mapTaskTone(status?: TaskStatus | string | null): StatusTone {
  if (status === TaskStatus.DONE || status === "DONE") return "success";
  if (status === TaskStatus.REVISION || status === "REVISION") return "attention";
  if (status === TaskStatus.IN_REVIEW || status === "IN_REVIEW") return "warning";
  if (status === TaskStatus.IN_PROGRESS || status === "IN_PROGRESS") return "active";
  return "neutral";
}

function mapTaskPriorityTone(priority?: TaskPriority | string | null): StatusTone {
  if (priority === TaskPriority.URGENT || priority === "URGENT") return "destructive";
  if (priority === TaskPriority.HIGH || priority === "HIGH") return "warning";
  return "neutral";
}

function mapDisputeStatusTone(status?: string | null): StatusTone {
  if (status === "RESOLVED" || status === "CLOSED") return "success";
  if (status === "ESCALATED") return "destructive";
  if (status === "PENDING_APPROVAL" || status === "PENDING_CLIENT") return "warning";
  if (status === "APPROVED" || status === "IN_PROGRESS") return "active";
  return "neutral";
}

function mapDisputePriorityTone(priority?: string | null): StatusTone {
  if (priority === "URGENT") return "destructive";
  if (priority === "HIGH") return "warning";
  if (priority === "NORMAL") return "attention";
  return "neutral";
}

function mapRoleLabel(role?: string | null) {
  switch (role) {
    case UserRole.ADMIN:
      return "Admin";
    case UserRole.PM:
      return "Project Management";
    case UserRole.SALES:
      return "Sales";
    case UserRole.TEAM:
      return "Team";
    case UserRole.MARKETING:
      return "Marketing";
    case UserRole.ACCOUNTANT:
      return "Finance";
    case UserRole.CLIENT:
      return "Client";
    default:
      return role ?? "User";
  }
}

function mapDepartmentLabel(role?: string | null, department?: string | null) {
  if (department) return department;
  return mapRoleLabel(role);
}

function mapBusinessType(type?: string | null) {
  if (!type) return BusinessType.OTHER;
  if (Object.values(BusinessType).includes(type as BusinessType)) {
    return type as BusinessType;
  }
  return BusinessType.OTHER;
}

function mapSource(source?: string | null) {
  if (!source) return ClientSource.PLATFORM;
  if (Object.values(ClientSource).includes(source as ClientSource)) {
    return source as ClientSource;
  }
  return ClientSource.PLATFORM;
}

function getTaskSignal(task: {
  status?: string | null;
  priority?: string | null;
  dueDate?: string | Date | null;
  revisionCount?: number | null;
  assignedTo?: string | null;
}) {
  const days = diffDays(task.dueDate);
  if (!task.assignedTo) {
    return {
      label: "Unassigned",
      summary: "No assignee is currently attached to this task.",
      tone: "destructive" as const,
    };
  }
  if (days !== null && days < 0 && task.status !== "DONE") {
    return {
      label: "Overdue",
      summary: "The due date passed while the task is still open.",
      tone: "destructive" as const,
    };
  }
  if ((task.revisionCount ?? 0) > 0 || task.status === "REVISION") {
    return {
      label: "Revision",
      summary: "This task has already entered at least one revision loop.",
      tone: "attention" as const,
    };
  }
  if (task.status === "IN_REVIEW") {
    return {
      label: "Review",
      summary: "The task is waiting for a review or approval decision.",
      tone: "warning" as const,
    };
  }
  if (task.priority === "URGENT" || task.priority === "HIGH") {
    return {
      label: "Priority",
      summary: "This task is one of the higher-priority open items.",
      tone: "warning" as const,
    };
  }
  return {
    label: "On track",
    summary: "The task is active with no immediate risk signal.",
    tone: "success" as const,
  };
}

function mapPeriodStatusLabel(status?: ProjectPeriodStatus | string | null) {
  if (status === ProjectPeriodStatus.ACTIVE || status === "ACTIVE") return "Active";
  if (status === ProjectPeriodStatus.CLOSED || status === "CLOSED") return "Closed";
  if (status === ProjectPeriodStatus.SUSPENDED || status === "SUSPENDED") return "Suspended";
  return "Upcoming";
}

function mapPeriodStatusTone(status?: ProjectPeriodStatus | string | null): StatusTone {
  if (status === ProjectPeriodStatus.ACTIVE || status === "ACTIVE") return "active";
  if (status === ProjectPeriodStatus.CLOSED || status === "CLOSED") return "success";
  if (status === ProjectPeriodStatus.SUSPENDED || status === "SUSPENDED") return "destructive";
  return "attention";
}

function mapMeetingStatus(status?: MeetingStatus | string | null) {
  if (!status) return "Scheduled";
  return String(status).replaceAll("_", " ");
}

function projectCurrentPeriodLabel(periods: Array<any>) {
  const active = periods.find((period) => period.status === "ACTIVE");
  if (active) return `P${active.periodNumber}/${periods.length}`;
  if (periods[0]) return `P${periods[0].periodNumber}/${periods.length}`;
  return "One-off";
}

function mapRequestStatusToStage(status?: string | null) {
  switch (status) {
    case "SUBMITTED":
      return "NEW";
    case "QUALIFYING":
      return "CALL_ATTEMPT";
    case "PROPOSAL_IN_PROGRESS":
      return "MEETING_DONE";
    case "PROPOSAL_SENT":
      return "PROPOSAL_SENT";
    case "NEGOTIATION":
      return "FOLLOW_UP";
    case "CONTRACT_PREPARATION":
    case "CONTRACT_SENT":
      return "APPROVED";
    case "SIGNED":
    case "PROJECT_CREATED":
      return "CONTRACT_SIGNED";
    case "CANCELLED":
      return "CALL_ATTEMPT";
    default:
      return status ?? "NEW";
  }
}

export function mapClientDetailFromApi(client: any): ClientDetailRecord {
  const outstanding =
    (client.totalContractValue ?? 0) - (client.totalPaid ?? 0);
  const stage = mapClientStage(client.status, client.activeProjects ?? 0);
  const summary: ClientDirectoryRecord = {
    id: client.id,
    contactName: client.contactName ?? client.user?.name ?? "Unknown contact",
    companyName: client.companyName ?? client.businessName ?? "Unnamed client",
    stage,
    totalProjects: client.totalProjects ?? client.projects?.length ?? 0,
    activeProjects: client.activeProjects ?? 0,
    openOrders: client.counters?.requests ?? 0,
    pendingOffers: client.counters?.proposals ?? 0,
    signedContracts: client.counters?.contracts ?? client.contracts?.length ?? 0,
    totalSpend: client.totalPaid ?? 0,
    outstandingAmount: Math.max(outstanding, 0),
    lastSeen: client.user?.lastLoginAt ? formatDateTime(client.user.lastLoginAt) : "No portal activity",
    owner: client.manager?.name ?? "Unassigned",
    stageTone: mapClientTypeTone(stage),
    financeTone: mapFinanceTone(Math.max(outstanding, 0)),
  };

  const invoiceTrend = [...(client.invoices ?? [])]
    .sort((a, b) => new Date(a.issueDate ?? a.createdAt).getTime() - new Date(b.issueDate ?? b.createdAt).getTime())
    .slice(-6)
    .map((invoice: any) => ({
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(invoice.issueDate ?? invoice.createdAt)),
      revenue: invoice.amount ?? 0,
      paid: Math.max((invoice.amount ?? 0) - (invoice.remainingAmount ?? 0), 0),
      outstanding: invoice.remainingAmount ?? 0,
    }));

  const disputes = (client.disputes ?? []).map((item: any) => ({
    title: item.title,
    relatedTo: item.relatedTo ?? item.ticketNumber ?? "Client issue",
    status: item.status ?? "Open",
    priority: item.priority ?? "Normal",
    openedAt: formatDate(item.openedAt ?? item.createdAt),
    owner: item.owner ?? item.pmName ?? client.manager?.name ?? "Unassigned",
    blocker: item.blocker ?? item.summary ?? "Review dispute record.",
    tone: mapDisputeStatusTone(item.status),
  }));

  return {
    id: client.id,
    chatTargetUserId: client.user?.id ?? null,
    contactName: summary.contactName,
    companyName: summary.companyName,
    email: client.user?.email ?? "—",
    phone: client.user?.phoneWhatsapp ?? "—",
    contactRole: client.type === "user" ? "Client account" : "Primary contact",
    portalStatus: client.hasPortalAccess ? "Portal enabled" : "Portal pending",
    lastSeen: summary.lastSeen,
    owner: summary.owner,
    summary,
    businessProfile: client.profile ?? {},
    stats: [
      {
        label: "Contract value",
        value: formatCurrency(client.totalContractValue),
        description: "Total signed value currently linked to this account.",
      },
      {
        label: "Paid to date",
        value: formatCurrency(client.totalPaid),
        description: "Payments successfully recorded against this client.",
      },
      {
        label: "Outstanding",
        value: formatCurrency(Math.max(outstanding, 0)),
        description: "Remaining billed value that is still open.",
        tone: Math.max(outstanding, 0) > 0 ? "warning" : "success",
        trendLabel: Math.max(outstanding, 0) > 0 ? "Needs finance follow-up" : "Clear",
      },
      {
        label: "Satisfaction",
        value: client.avgSatisfactionScore ? `${client.avgSatisfactionScore.toFixed(1)}/5` : "No rating",
        description: "Average satisfaction score from collected ratings.",
      },
    ],
    spendTrend: invoiceTrend,
    commercialMix: [
      {
        label: "Current",
        projects: summary.activeProjects,
        offers: summary.pendingOffers,
        contracts: summary.signedContracts,
      },
    ],
    risks: [
      ...(Math.max(outstanding, 0) > 0
        ? [
            {
              item: "Outstanding balance",
              type: "Finance",
              blocker: `${client.overdueInvoicesCount ?? 0} invoice(s) remain open.`,
              amountOrStatus: formatCurrency(Math.max(outstanding, 0)),
              owner: "Finance",
              action: "Follow up on overdue invoices",
              tone: "warning" as const,
            },
          ]
        : []),
      ...(disputes.length > 0
        ? disputes.map((item: (typeof disputes)[number]) => ({
            item: item.title,
            type: "Dispute",
            blocker: item.blocker,
            amountOrStatus: item.status,
            owner: item.owner,
            action: "Resolve dispute path",
            tone: item.tone,
          }))
        : []),
    ],
    projectsCommercial: [
      ...(client.projects ?? []).map((project: any) => ({
        item: project.name,
        category: "Project",
        status: project.status,
        amount: `${project.completionPercentage ?? 0}% complete`,
        owner: project.pmName ?? "Unassigned",
        due: formatDate(project.endDate),
        tone: mapProjectTone(project.status),
      })),
      ...(client.contracts ?? []).slice(0, 3).map((contract: any) => ({
        item: contract.title,
        category: "Contract",
        status: contract.status,
        amount: formatCurrency(contract.totalValue),
        owner: summary.owner,
        due: formatDate(contract.endDate),
        tone: mapContractTone(contract.status),
      })),
    ],
    disputes,
    activity: (client.historyLogs ?? []).map((log: any) => ({
      title: log.eventType?.replaceAll("_", " ") ?? "Client update",
      description: log.description ?? "Backend activity entry.",
      time: formatDateTime(log.occurredAt),
      impact: log.userName ?? "System",
      tone: "neutral" as const,
    })),
  };
}

export function mapOrderDetailFromApi(order: any): OrderDetailRecord {
  const request = order?.request ?? order?.lead?.request ?? null;
  const lead = order?.lead ?? request?.lead ?? null;
  const primary = request ?? lead ?? order;
  const pipelineSource = lead ?? request?.lead ?? primary;
  const commercialSource = request ?? primary;

  const contactLogs = (commercialSource.contactLogs ?? pipelineSource.contactLogs ?? order.contactLogs ?? []) as any[];
  const proposals = (commercialSource.proposals ?? pipelineSource.proposals ?? order.proposals ?? []) as any[];
  const contracts = (commercialSource.contracts ?? order.contracts ?? []) as any[];
  const services = (commercialSource.services ?? pipelineSource.services ?? order.services ?? []) as any[];
  const client = commercialSource.client ?? pipelineSource.client ?? order.client ?? null;

  const stage =
    commercialSource.crmStage ??
    pipelineSource.crmStage ??
    pipelineSource.pipelineStage ??
    (commercialSource.status ? mapRequestStatusToStage(String(commercialSource.status)) : "NEW");
  const stageLabel = String(stage ?? "NEW").replaceAll("_", " ");
  const stageIndex = [
    "NEW",
    "INTRO_SENT",
    "CALL_ATTEMPT",
    "MEETING_SCHEDULED",
    "MEETING_DONE",
    "PROPOSAL_SENT",
    "FOLLOW_UP",
    "APPROVED",
    "CONTRACT_SIGNED",
  ].indexOf(String(stage));
  const stageProgress =
    stageIndex < 0 ? "0%" : `${Math.round((stageIndex / 8) * 100)}%`;

  const estimatedValue =
    proposals[0]?.totalPrice ??
    proposals.reduce((sum: number, proposal: any) => sum + (proposal.totalPrice ?? 0), 0) ??
    contracts[0]?.totalValue ??
    0;

  const touchpointBuckets = new Map<
    string,
    { label: string; calls: number; meetings: number; messages: number }
  >();
  for (const log of contactLogs) {
    const key = formatDate(log.contactedAt);
    const bucket =
      touchpointBuckets.get(key) ?? { label: key, calls: 0, meetings: 0, messages: 0 };
    if (log.type === "CALL") bucket.calls += 1;
    else if (log.type === "MEETING") bucket.meetings += 1;
    else bucket.messages += 1;
    touchpointBuckets.set(key, bucket);
  }

  const lastContactAt = commercialSource.lastContactAt ?? pipelineSource.lastContactAt ?? null;
  const createdAt = commercialSource.createdAt ?? pipelineSource.createdAt ?? order.createdAt;
  const openedDaysAgo = Math.max(
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000),
    0,
  );
  const clientStatus =
    client && (client.activeProjects > 0 || client.completedProjects > 0 || client.totalProjects > 0)
      ? "Client"
      : "Lead";
  const owner =
    pipelineSource.assignee?.name ??
    commercialSource.assignee?.name ??
    commercialSource.submitter?.name ??
    pipelineSource.creator?.name ??
    "Unassigned";
  const serviceLine =
    services
      .map((item: any) => item.service?.nameAr || item.service?.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(", ") || "Unassigned service line";
  const note =
    commercialSource.crmNotes?.[0]?.content ??
    commercialSource.internalNotes ??
    commercialSource.notes ??
    pipelineSource.crmNotes?.[0]?.content ??
    pipelineSource.notes ??
    contactLogs[0]?.notes ??
    "No additional notes on the record.";
  const latestProposal = proposals[0] ?? null;
  const latestContract = contracts[0] ?? null;
  const contactAttemptCount =
    commercialSource.contactAttemptCount ?? pipelineSource.contactAttemptCount ?? contactLogs.length ?? 0;

  const stageTone = (() => {
    if (stage === "APPROVED" || stage === "CONTRACT_SIGNED") return "success" as const;
    if (stage === "MEETING_SCHEDULED" || stage === "MEETING_DONE") return "active" as const;
    if (stage === "FOLLOW_UP" || stage === "PROPOSAL_SENT") return "warning" as const;
    if (stage === "CALL_ATTEMPT") return "attention" as const;
    return "neutral" as const;
  })();

  const statusSummary =
    stage === "CONTRACT_SIGNED"
      ? "Commercial close is complete and waiting for delivery handoff."
      : stage === "APPROVED"
        ? "Commercial approval is in place and contract work can move forward."
        : stage === "FOLLOW_UP"
          ? "The record is in follow-up and needs a decision loop to close."
          : stage === "PROPOSAL_SENT"
            ? "A proposal is active and waiting on client feedback."
            : stage === "MEETING_DONE"
              ? "Discovery is complete and the commercial next step is proposal prep."
              : "Commercial activity is still in progress.";

  const summaryNextAction = (() => {
    if (stage === "CONTRACT_SIGNED") return "Handoff to project setup";
    if (stage === "APPROVED") return "Prepare contract package";
    if (stage === "FOLLOW_UP") return "Close the commercial decision loop";
    if (stage === "PROPOSAL_SENT") return "Review proposal feedback";
    if (stage === "MEETING_DONE") return "Draft the proposal";
    if (stage === "MEETING_SCHEDULED") return "Hold the scheduled meeting";
    if (stage === "CALL_ATTEMPT") return "Retry follow-up";
    return "Continue qualification";
  })();

  return {
    id: primary.id,
    companyName: commercialSource.companyName ?? pipelineSource.companyName ?? "Unnamed lead",
    contactName: commercialSource.contactName ?? pipelineSource.contactName ?? "Unknown contact",
    phone: commercialSource.phoneWhatsapp ?? pipelineSource.phoneWhatsapp ?? "—",
    email: commercialSource.email ?? pipelineSource.email ?? "—",
    businessName: commercialSource.businessName ?? pipelineSource.businessName ?? "—",
    businessType: mapBusinessType(commercialSource.businessType ?? pipelineSource.businessType),
    source: mapSource(commercialSource.source ?? pipelineSource.source),
    owner,
    openedAt: formatDateTime(createdAt),
    lastContact: formatDateTime(lastContactAt),
    nextFollowUp: summaryNextAction,
    stage: stage as any,
    stageTone,
    estimatedValue,
    notes: note,
    serviceLine,
    statusSummary,
    sidebarSummary: [
      {
        label: "Contact attempts",
        value: String(contactAttemptCount),
        helper: "Calls, WhatsApp follow-ups, and meetings logged on the CRM record.",
      },
      {
        label: "Latest proposal",
        value: latestProposal ? String(latestProposal.status).replaceAll("_", " ") : "Not started",
        helper: "Most recent commercial status linked to this record.",
      },
      {
        label: "Client relation",
        value: client ? clientStatus : "Lead only",
        helper: "Whether the record is linked to an active client account.",
      },
      {
        label: "Pipeline age",
        value: `${openedDaysAgo} days`,
        helper: "Measured from the original CRM opening date.",
      },
    ],
    client: client
      ? {
          id: client.id,
          companyName: client.companyName ?? commercialSource.companyName ?? "Client",
          contactName: commercialSource.contactName ?? pipelineSource.contactName ?? "Primary contact",
          status: clientStatus,
          owner,
          lastSeen: client.user?.lastLoginAt ? formatDateTime(client.user.lastLoginAt) : "No portal activity",
        }
      : null,
    metrics: [
      {
        label: "Current stage",
        value: stageLabel,
        description: "Latest commercial stage from the backend CRM record.",
        trend:
          stage === "APPROVED" || stage === "CONTRACT_SIGNED"
            ? { label: "Near close", tone: "success" }
            : stage === "FOLLOW_UP" || stage === "PROPOSAL_SENT"
              ? { label: "Needs decision", tone: "warning" }
              : undefined,
      },
      {
        label: "Estimated value",
        value: formatCurrency(estimatedValue),
        description: "Latest proposal amount or contract value.",
      },
      {
        label: "Last contact",
        value: formatDateTime(lastContactAt),
        description: "Most recent CRM touchpoint.",
      },
      {
        label: "Stage progress",
        value: stageProgress,
        description: "Progress across the standard commercial pipeline.",
      },
    ],
    touchpoints: Array.from(touchpointBuckets.values()).slice(-6),
    contactTimeline: contactLogs.map((log: any) => ({
      id: log.id,
      type: log.type,
      result: log.result,
      happenedAt: formatDateTime(log.contactedAt),
      owner: log.user?.name ?? owner,
      summary: `${String(log.type ?? "Touchpoint").replaceAll("_", " ")}`,
      report: log.notes ?? "Contact log recorded with no additional notes.",
      nextAction:
        log.result === "RESPONDED"
          ? "Continue the conversation"
          : log.result === "BUSY"
            ? "Retry at a better time"
            : "Retry follow-up",
    })),
    stageHistory: ((pipelineSource.pipelineHistory ?? commercialSource.statusHistory ?? []) as any[]).map(
      (item: any) => ({
        id: item.id,
        fromStage:
          item.fromStage ?? mapRequestStatusToStage(item.fromStatus) ?? stage,
        toStage:
          item.toStage ?? mapRequestStatusToStage(item.toStatus) ?? stage,
        changedAt: formatDateTime(item.changedAt),
        changedBy: item.changer?.name ?? item.changedBy ?? owner,
        note: item.note ?? item.reason ?? "Pipeline stage updated.",
      }),
    ),
    noteHistory: ((commercialSource.crmNotes ?? pipelineSource.crmNotes ?? []) as any[]).map(
      (noteItem: any) => ({
        id: noteItem.id,
        content: noteItem.content,
        createdAt: formatDateTime(noteItem.createdAt),
        author: noteItem.author?.name ?? owner,
        isInternal: noteItem.isInternal ?? true,
      }),
    ),
    proposals: proposals.map((proposal: any) => ({
      id: proposal.id,
      title: proposal.title ?? `${String(commercialSource.companyName ?? pipelineSource.companyName ?? "Client")} commercial package`,
      status: proposal.status,
      amount: proposal.totalPrice ?? 0,
      createdAt: formatDateTime(proposal.createdAt),
      responseSignal: String(proposal.status ?? "No status").replaceAll("_", " "),
    })),
    relatedRecords: [
      {
        label: "Requested services",
        value: serviceLine,
        helper: "Service scope carried from the CRM record.",
      },
      {
        label: "Primary blocker",
        value: note,
        helper: "The latest note or commercial blocker captured in the record.",
      },
      {
        label: "Request origin",
        value: String(commercialSource.source ?? pipelineSource.source ?? "OTHER").replaceAll("_", " "),
        helper: "Acquisition source recorded on the backend CRM record.",
      },
    ],
  };
}

export function mapProposalDetailFromApi(proposal: any): ProposalDetailRecord {
  const services = proposal.request?.services ?? [];
  const clientName = proposal.client?.companyName ?? proposal.lead?.companyName ?? proposal.contactName ?? "Unknown client";
  return {
    id: proposal.id,
    title: proposal.title ?? "Proposal",
    clientName,
    requestName: proposal.request?.companyName ?? proposal.lead?.companyName ?? "Lead request",
    creator: proposal.creator?.name ?? "Unknown creator",
    owner: proposal.creator?.name ?? "Unknown creator",
    status: proposal.status,
    statusTone: mapProposalTone(proposal.status),
    totalValue: proposal.totalPrice ?? 0,
    sentLabel: proposal.sentAt ? formatDateTime(proposal.sentAt) : "Not sent",
    validUntilLabel: proposal.validUntil ? formatDate(proposal.validUntil) : "No expiry date",
    responseLabel: String(proposal.status ?? "DRAFT").replaceAll("_", " "),
    document: {
      fileName: proposal.documentPath?.split("/").pop() ?? `${proposal.title?.toLowerCase().replaceAll(" ", "-") ?? "proposal"}.pdf`,
      version: `v${proposal.versionNumber ?? 1}`,
      generatedAt: formatDateTime(proposal.updatedAt ?? proposal.createdAt),
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: clientName },
      { label: "Request", value: proposal.request?.companyName ?? "—" },
      { label: "Prepared by", value: proposal.creator?.name ?? "—" },
      { label: "Sent", value: proposal.sentAt ? formatDateTime(proposal.sentAt) : "Not sent" },
      { label: "Valid until", value: proposal.validUntil ? formatDate(proposal.validUntil) : "—" },
      { label: "Services", value: String(services.length) },
    ],
    metrics: [
      {
        label: "Proposal value",
        value: formatCurrency(proposal.totalPrice),
        description: "Current total proposal value.",
      },
      {
        label: "Services",
        value: String(services.length),
        description: "Service lines attached to the related request.",
      },
      {
        label: "Client response",
        value: String(proposal.status ?? "DRAFT").replaceAll("_", " "),
        description: "Current commercial decision state.",
        trend: { label: "Live proposal", tone: mapProposalTone(proposal.status) },
      },
      {
        label: "Contract link",
        value: proposal.contract?.title ?? "Not converted",
        description: "Contract record linked to this proposal, if any.",
      },
    ],
    services: services.map((item: any, index: number) => ({
      id: item.id ?? `${proposal.id}-service-${index + 1}`,
      service: item.service?.name ?? `Service ${index + 1}`,
      scope: item.scope ?? item.service?.description ?? "Scope not specified on the request.",
      quantity: String(item.quantity ?? 1),
      amount: item.price ?? item.totalPrice ?? 0,
    })),
    revisionHistory: [
      {
        id: `${proposal.id}-created`,
        date: formatDateTime(proposal.createdAt),
        title: "Proposal created",
        actor: proposal.creator?.name ?? "System",
        note: "Initial proposal record created.",
        status: "DRAFT",
        completed: true,
      },
      ...(proposal.sentAt
        ? [
            {
              id: `${proposal.id}-sent`,
              date: formatDateTime(proposal.sentAt),
              title: "Proposal sent",
              actor: proposal.creator?.name ?? "System",
              note: "Proposal was sent to the client.",
              status: proposal.status === "DRAFT" ? "SENT" : proposal.status,
              completed: true,
            },
          ]
        : []),
    ],
    commercialContext: [
      {
        label: "Commercial status",
        value: String(proposal.status ?? "DRAFT").replaceAll("_", " "),
        helper: "Current proposal decision state.",
      },
      {
        label: "Lead request",
        value: proposal.request?.contactName ?? proposal.lead?.contactName ?? "—",
        helper: "Primary request-side contact for this proposal.",
      },
      {
        label: "Contract readiness",
        value: proposal.contract ? "Already linked to contract" : "Still waiting conversion",
        helper: "Whether this proposal already progressed into contract work.",
      },
    ],
    linkedRecords: [
      {
        label: "Lead",
        value: proposal.lead?.companyName ?? "—",
      },
      {
        label: "Client",
        value: clientName,
        href: proposal.client?.id ? `/admin/clients/${proposal.client.id}` : undefined,
      },
      {
        label: "Contract",
        value: proposal.contract?.title ?? "No contract yet",
        href: proposal.contract?.id ? `/admin/contracts/${proposal.contract.id}` : undefined,
        tone: proposal.contract ? mapContractTone(proposal.contract.status) : undefined,
      },
    ],
  };
}

export function mapContractDetailFromApi(contract: any): ContractDetailRecord {
  const openInvoices = (contract.invoices ?? []).filter((invoice: any) =>
    ["SENT", "DUE", "LATE", "PARTIAL"].includes(invoice.status),
  );
  const paymentPlan: ContractPaymentRow[] =
    contract.paymentPlans?.map((plan: any) => ({
      id: plan.id,
      label: plan.label ?? `Payment ${plan.installmentNumber ?? ""}`.trim(),
      due: formatDate(plan.dueDate),
      amount: plan.amount ?? 0,
      status: plan.status ?? "Planned",
      tone: mapContractTone(plan.status),
    })) ?? [];

  return {
    id: contract.id,
    title: contract.title ?? "Contract",
    clientName: contract.client?.companyName ?? "Unknown client",
    typeLabel: String(contract.type ?? "Contract").replaceAll("_", " "),
    status: contract.status,
    statusTone: mapContractTone(contract.status),
    totalValue: contract.totalValue ?? 0,
    monthlyValue: contract.monthlyValue ?? null,
    signedLabel: contract.signedAt ? formatDate(contract.signedAt) : "Not signed",
    endLabel: formatDate(contract.endDate),
    renewalLabel: contract.renewalAlerts?.[0]?.scheduledAt ? formatDate(contract.renewalAlerts[0].scheduledAt) : "No renewal alert",
    document: {
      fileName: contract.documentPath?.split("/").pop() ?? `${contract.title?.toLowerCase().replaceAll(" ", "-") ?? "contract"}.pdf`,
      version: `v${contract.versionNumber ?? 1}`,
      generatedAt: formatDateTime(contract.updatedAt ?? contract.createdAt),
      signerState: contract.eSigned ? "E-signed" : "Signature pending",
      openHref: "#",
    },
    sidebarFacts: [
      { label: "Client", value: contract.client?.companyName ?? "—" },
      { label: "Type", value: String(contract.type ?? "—").replaceAll("_", " ") },
      { label: "Signed", value: contract.signedAt ? formatDate(contract.signedAt) : "Not signed" },
      { label: "Start date", value: formatDate(contract.startDate) },
      { label: "End date", value: formatDate(contract.endDate) },
      { label: "Renewal", value: contract.renewalAlerts?.[0]?.scheduledAt ? formatDate(contract.renewalAlerts[0].scheduledAt) : "—" },
    ],
    metrics: [
      {
        label: "Total value",
        value: formatCurrency(contract.totalValue),
        description: "Total contract value.",
      },
      {
        label: "Monthly value",
        value: contract.monthlyValue ? formatCurrency(contract.monthlyValue) : "—",
        description: "Recurring monthly value when the contract uses a retainer model.",
      },
      {
        label: "Open invoices",
        value: String(openInvoices.length),
        description: "Invoices still awaiting settlement.",
        trend: openInvoices.length > 0 ? { label: "Finance follow-up", tone: "warning" } : undefined,
      },
      {
        label: "Project link",
        value: contract.project?.name ?? "No linked project",
        description: "Delivery project attached to this contract, if any.",
      },
    ],
    paymentPlan,
    statusHistory: (contract.statusHistory ?? []).map((item: any) => ({
      id: item.id,
      date: formatDateTime(item.changedAt),
      title: `${String(item.fromStatus ?? "UNKNOWN").replaceAll("_", " ")} -> ${String(item.toStatus ?? "UNKNOWN").replaceAll("_", " ")}`,
      actor: item.changedBy ?? "System",
      note: item.reason ?? "Contract status updated.",
      status: item.toStatus,
      completed: true,
    })),
    billingContext: [
      {
        label: "Open invoices",
        value: String(openInvoices.length),
        helper: "Current invoices still waiting payment or finance closure.",
      },
      {
        label: "Delivery link",
        value: contract.project?.name ?? "No linked project",
        helper: "Whether delivery execution is already attached to this agreement.",
      },
      {
        label: "Renewal watch",
        value: contract.renewalAlerts?.[0]?.alertType ?? "No alert",
        helper: "Latest renewal alert or expiry reminder on this contract.",
      },
    ],
    linkedRecords: [
      {
        label: "Client",
        value: contract.client?.companyName ?? "—",
        href: contract.client?.id ? `/admin/clients/${contract.client.id}` : undefined,
      },
      {
        label: "Project",
        value: contract.project?.name ?? "No linked project",
        href: contract.project?.id ? `/admin/projects/${contract.project.id}` : undefined,
        tone: contract.project ? mapProjectTone(contract.project.status) : undefined,
      },
      {
        label: "Invoices",
        value: `${contract.invoices?.length ?? 0} invoice(s)`,
        tone: openInvoices.length > 0 ? "warning" : "success",
      },
    ],
  };
}

export function mapProjectDetailFromApi(project: any): ProjectDetailRecord {
  const totalPeriods = project.periods?.length ?? 0;
  const currentPeriod = project.periods?.find((period: any) => period.status === "ACTIVE") ?? project.periods?.[0];
  const financeRows: ProjectDetailFinanceRow[] = (project.invoices ?? []).map((invoice: any) => ({
    id: invoice.id,
    item: invoice.invoiceNumber ?? "Invoice",
    type: "Invoice",
    status: invoice.status,
    statusTone: invoice.status === "PAID" ? "success" : ["LATE", "DUE", "PARTIAL", "SENT"].includes(invoice.status) ? "warning" : "neutral",
    amount: formatCurrency(invoice.amount),
    due: formatDate(invoice.dueDate),
    owner: "Finance",
  }));

  const taskRows: TaskDirectoryRecord[] = (project.tasks ?? []).map((task: any) => {
    const signal = getTaskSignal(task);
    return {
      id: task.id,
      title: task.title,
      projectId: project.id,
      projectName: project.name,
      clientName: project.client?.companyName ?? "—",
      projectStatus: project.status,
      department: task.department?.name ?? TaskDepartment.DESIGN,
      assigneeName: task.assignee?.name ?? null,
      status: task.status,
      priority: task.priority,
      dueDateLabel: formatDueLabel(task.dueDate),
      dueOffsetDays: diffDays(task.dueDate) ?? 0,
      periodLabel: task.period?.periodNumber ? `P${task.period.periodNumber}/${Math.max(totalPeriods, task.period.periodNumber)}` : projectCurrentPeriodLabel(project.periods ?? []),
      isClientVisible: !!task.isVisibleToClient,
      isArchived: !!task.archivedAt,
      revisionCount: task.revisionCount ?? 0,
      signalLabel: signal.label,
      signalSummary: signal.summary,
      signalTone: signal.tone,
    };
  });

  const historyRows: ProjectDetailHistoryRow[] = (project.history ?? []).map((item: any) => ({
    id: item.id,
    date: formatDateTime(item.createdAt),
    title: item.action?.replaceAll(".", " ") ?? "Project update",
    summary: item.userName ? `Recorded by ${item.userName}.` : "System change recorded.",
    meta: item.userName ?? "System",
    tone: "neutral",
    completed: true,
  }));

  const periods: ProjectDetailPeriodRow[] = (project.periods ?? []).map((period: any) => {
    const periodTasks = taskRows.filter((task) => task.periodLabel.startsWith(`P${period.periodNumber}/`));
    const periodMeetings = (project.meetings ?? [])
      .filter((meeting: any) => meeting.periodId === period.id)
      .map((meeting: any) => ({
        id: meeting.id,
        title: meeting.title,
        date: formatDateTime(meeting.scheduledAt),
        owner: meeting.creator?.name ?? "Team",
        note: meeting.notes ?? mapMeetingStatus(meeting.status),
      }));
    const periodFiles = (project.files ?? []).map((file: any) => ({
      id: file.id,
      name: file.fileName,
      type: file.filePath?.split(".").pop()?.toUpperCase() ?? "FILE",
      uploadedAt: formatDateTime(file.uploadedAt),
      uploadedBy: file.uploader?.name ?? file.uploadedBy ?? "System",
    }));
    return {
      id: period.id,
      label: `Period ${period.periodNumber}`,
      status: mapPeriodStatusLabel(period.status),
      statusTone: mapPeriodStatusTone(period.status),
      window: `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
      windowShort: `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
      completion: Math.round(period.completionPercentage ?? 0),
      billing: currentPeriod?.id === period.id ? formatCurrency(project.monthlyValue || project.totalValue) : "Linked to project billing",
      focus: period.summary ?? (periodTasks[0]?.signalSummary ?? "No summary recorded for this period."),
      shortDate: formatDate(period.endDate),
      markerLabel: period.status === "ACTIVE" ? "Current" : undefined,
      tasks: periodTasks,
      meetings: periodMeetings,
      files: periodFiles,
      invoices: financeRows,
      history: historyRows.filter((_, index) => index < 4),
      disputes: (project.disputeTickets ?? []).map((ticket: any) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        openedAtLabel: formatDate(ticket.openedAt),
        lastActivityLabel: formatDate(ticket.deadlineAt ?? ticket.openedAt),
        signalLabel: ticket.status === "ESCALATED" ? "Escalated" : "Open case",
        signalSummary: ticket.status === "ESCALATED" ? "Requires administrative intervention." : "Project-linked dispute still open.",
      })),
    };
  });

  const disputeRows = (project.disputeTickets ?? []).map((ticket: any) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    openedAtLabel: formatDate(ticket.openedAt),
    lastActivityLabel: formatDate(ticket.deadlineAt ?? ticket.openedAt),
    signalLabel: ticket.status === "ESCALATED" ? "Escalated" : "Open case",
    signalSummary: ticket.status === "ESCALATED" ? "Requires administrative intervention." : "Project-linked dispute still open.",
  }));

  const departments = Array.from(new Set(taskRows.map((task) => task.department)));
  const teamRows: ProjectDetailTeamRow[] = [
    ...(project.manager
      ? [
          {
            id: project.manager.id,
            name: project.manager.name,
            role: "Project manager",
            department: "Project Management",
            workload: `${project.tasks?.length ?? 0} tasks`,
            focus: currentPeriod?.summary ?? "Current delivery oversight",
            tone: "active" as const,
          },
        ]
      : []),
    ...(project.members ?? []).map((member: any) => ({
      id: member.id,
      name: member.user?.name ?? "Team member",
      role: String(member.role ?? "Member").replaceAll("_", " "),
      department: "Assigned team",
      workload: `${taskRows.filter((task) => task.assigneeName === member.user?.name).length} tasks`,
      focus: "Project contribution",
      tone: "neutral" as const,
    })),
    ...departments
      .filter(Boolean)
      .map((department: any, index: number) => ({
        id: `dept-${department}-${index}`,
        name: `${String(department)} lead`,
        role: "Department lead",
        department: String(department),
        workload: `${taskRows.filter((task) => task.department === department).length} tasks`,
        focus: "Department execution",
        tone: "neutral" as const,
      })),
  ];

  return {
    id: project.id,
    name: project.name,
    clientName: project.client?.companyName ?? "Unknown client",
    clientId: project.client?.id ?? null,
    projectManager: project.manager?.name ?? "Unassigned",
    projectManagerEmail: project.manager?.email ?? "—",
    status: String(project.status ?? "PLANNING").replaceAll("_", " "),
    statusTone: mapProjectTone(project.status),
    healthLabel: project.completionPercentage >= 80 ? "Healthy" : project.completionPercentage >= 50 ? "Needs follow-up" : "At risk",
    healthTone: project.completionPercentage >= 80 ? "success" : project.completionPercentage >= 50 ? "warning" : "attention",
    archived: !!project.isArchived,
    modelLabel: project.monthlyValue ? "Recurring retainer" : "One-off delivery",
    priorityLabel: String(project.priority ?? "NORMAL").replaceAll("_", " "),
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.endDate),
    timelineLabel: `${formatDate(project.startDate)} - ${formatDate(project.endDate)}`,
    departmentsLabel: departments.join(", ") || "No departments yet",
    totalValue: formatCurrency(project.totalValue),
    remainingValue: formatCurrency(
      (project.totalValue ?? 0) -
        (project.payments ?? [])
          .filter((payment: any) => payment.status === "SUCCESS")
          .reduce((sum: number, payment: any) => sum + (payment.amount ?? 0), 0),
    ),
    currentPeriodLabel: currentPeriod ? `Period ${currentPeriod.periodNumber}` : "No period",
    currentPeriodStatusLabel: currentPeriod ? mapPeriodStatusLabel(currentPeriod.status) : "No period",
    currentPeriodStatusTone: currentPeriod ? mapPeriodStatusTone(currentPeriod.status) : "neutral",
    metrics: [
      {
        label: "Completion",
        value: `${Math.round(project.completionPercentage ?? 0)}%`,
        description: "Current project completion percentage.",
      },
      {
        label: "Tasks",
        value: String(taskRows.length),
        description: "Tasks currently returned for this project.",
      },
      {
        label: "Disputes",
        value: String(disputeRows.length),
        description: "Dispute tickets currently linked to the project.",
      },
      {
        label: "Value",
        value: formatCurrency(project.totalValue),
        description: "Total contract value attached to this project.",
      },
    ],
    periods,
    taskRows,
    financeRows,
    disputeRows: disputeRows as any,
    teamRows,
    historyRows,
    meetingRows: (project.meetings ?? []).map((meeting: any) => ({
      id: meeting.id,
      title: meeting.title,
      date: formatDateTime(meeting.scheduledAt),
      owner: meeting.creator?.name ?? "Team",
      note: meeting.notes ?? mapMeetingStatus(meeting.status),
    })),
    fileRows: (project.files ?? []).map((file: any) => ({
      id: file.id,
      name: file.fileName,
      type: file.filePath?.split(".").pop()?.toUpperCase() ?? "FILE",
      uploadedAt: formatDateTime(file.uploadedAt),
      uploadedBy: file.uploader?.name ?? file.uploadedBy ?? "System",
    })),
    pmOptions: project.manager
      ? [
          {
            id: project.manager.id,
            name: project.manager.name,
            email: project.manager.email ?? "—",
          },
        ]
      : [],
  };
}

export function mapTaskDetailFromApi(task: any): TaskDetailRecord {
  const signal = getTaskSignal(task);
  const client = task.project?.client;
  const role = task.comments?.[0]?.userRole;
  const dueDateValue = formatDate(task.dueDate);
  return {
    id: task.id,
    title: task.title ?? "Task",
    description: task.description ?? "No task description provided.",
    status: task.status,
    statusLabel: String(task.status ?? "TODO").replaceAll("_", " "),
    statusTone: mapTaskTone(task.status),
    priority: task.priority,
    priorityLabel: String(task.priority ?? "NORMAL").replaceAll("_", " "),
    priorityTone: mapTaskPriorityTone(task.priority),
    department: task.department?.name ?? TaskDepartment.DESIGN,
    departmentLabel: task.department?.name ?? "Unassigned department",
    projectId: task.project?.id ?? "",
    projectName: task.project?.name ?? "Unknown project",
    projectStatus: task.project?.status ?? ProjectStatus.PLANNING,
    projectStatusLabel: String(task.project?.status ?? "PLANNING").replaceAll("_", " "),
    projectStatusTone: mapProjectTone(task.project?.status),
    clientId: client?.id ?? null,
    clientName: client?.companyName ?? "No linked client",
    clientStageLabel: client?.status ? String(client.status).replaceAll("_", " ") : null,
    clientStageTone: client?.status === "ACTIVE" ? "active" : "neutral",
    assigneeName: task.assignee?.name ?? null,
    assigneeInitials: buildInitials(task.assignee?.name),
    projectManager: task.project?.manager?.name ?? "Unassigned",
    dueDateLabel: formatDueLabel(task.dueDate),
    dueDateValue,
    periodLabel: task.period?.periodNumber ? `P${task.period.periodNumber}` : "No period",
    isClientVisible: !!task.isVisibleToClient,
    revisionCount: task.revisionCount ?? 0,
    isArchived: !!task.archivedAt,
    signalLabel: signal.label,
    signalSummary: signal.summary,
    signalTone: signal.tone,
    workflow: [
      { key: "todo", label: "To do", state: task.status === "TODO" ? "current" : "completed" },
      { key: "in_progress", label: "In progress", state: task.status === "IN_PROGRESS" ? "current" : ["IN_REVIEW", "DONE", "REVISION"].includes(task.status) ? "completed" : "upcoming" },
      { key: "in_review", label: "In review", state: task.status === "IN_REVIEW" ? "current" : ["DONE", "REVISION"].includes(task.status) ? "completed" : "upcoming" },
      { key: "done", label: task.status === "REVISION" ? "Revision" : "Done", state: ["DONE", "REVISION"].includes(task.status) ? "current" : "upcoming", value: task.status === "REVISION" ? String(task.revisionCount ?? 1) : undefined },
    ],
    metrics: [
      {
        label: "Revision count",
        value: String(task.revisionCount ?? 0),
        description: "How many revision loops this task already entered.",
      },
      {
        label: "Comments",
        value: String(task.comments?.length ?? 0),
        description: "Latest discussion entries returned for this task.",
      },
      {
        label: "Files",
        value: String(task.files?.length ?? 0),
        description: "Files attached to this task.",
      },
      {
        label: "Client visibility",
        value: task.isVisibleToClient ? "Visible" : "Internal",
        description: "Whether the client can directly see this task.",
      },
    ],
    clientSummary: [
      {
        label: "Client",
        value: client?.companyName ?? "No linked client",
        helper: "Client currently attached to the parent project.",
      },
      {
        label: "Client stage",
        value: client?.status ?? "—",
        helper: "Current client lifecycle state from the backend record.",
      },
      {
        label: "Active projects",
        value: String(client?.activeProjects ?? 0),
        helper: "Number of active projects on the client profile.",
      },
      {
        label: "Paid to date",
        value: formatCurrency(client?.totalPaid ?? 0),
        helper: "Total paid value currently recorded for the client.",
      },
    ],
    comments: (task.comments ?? []).map((comment: any) => ({
      id: comment.id,
      author: comment.user?.name ?? "Team",
      role: comment.isInternal ? (comment.userRole === UserRole.ADMIN ? "Admin" : comment.userRole === UserRole.PM ? "PM" : "Assignee") : "PM",
      postedAt: formatDateTime(comment.createdAt),
      message: comment.content,
      tone: comment.isInternal ? "neutral" : "active",
    })),
    files: (task.files ?? []).map((file: any) => ({
      id: file.id,
      name: file.fileName,
      purpose: file.purpose ?? "Attachment",
      uploadedAt: formatDateTime(file.uploadedAt),
      uploadedBy: file.uploaderName ?? "Unknown uploader",
      mime: file.fileType ?? "FILE",
    })),
    history: (task.statusHistory ?? []).map((item: any) => ({
      id: item.id,
      date: formatDateTime(item.changedAt),
      title: `${String(item.fromStatus ?? "TODO").replaceAll("_", " ")} -> ${String(item.toStatus ?? "TODO").replaceAll("_", " ")}`,
      summary: item.reason ?? "Task status updated.",
      actor: item.changer?.name ?? "System",
      tone: mapTaskTone(item.toStatus),
      completed: true,
    })),
  };
}

export function mapDisputeDetailFromApi(dispute: any): DisputeDetailRecord {
  const statusTone = mapDisputeStatusTone(dispute.status);
  const priorityTone = mapDisputePriorityTone(dispute.priority);
  return {
    id: dispute.id,
    ticketNumber: dispute.ticketNumber ?? dispute.id,
    title: dispute.title ?? "Dispute",
    categoryLabel: String(dispute.category ?? "General").replaceAll("_", " "),
    statusLabel: String(dispute.status ?? "OPEN").replaceAll("_", " "),
    statusTone,
    priorityLabel: String(dispute.priority ?? "NORMAL").replaceAll("_", " "),
    priorityTone,
    openedAt: formatDateTime(dispute.openedAt ?? dispute.createdAt),
    lastActivity: formatDateTime(dispute.updatedAt ?? dispute.deadlineAt ?? dispute.openedAt),
    deadlineLabel: dispute.deadlineAt ? formatDate(dispute.deadlineAt) : "No SLA deadline",
    ageLabel: dispute.openedAt ? `${Math.max(Math.abs(diffDays(dispute.openedAt) ?? 0), 0)}d` : "—",
    signalLabel: dispute.status === "ESCALATED" ? "Escalated" : dispute.status === "PENDING_APPROVAL" ? "Awaiting approval" : "Active case",
    signalSummary:
      dispute.status === "ESCALATED"
        ? "This case already escalated and needs administrative action."
        : dispute.status === "PENDING_APPROVAL"
          ? "The dispute cannot move forward until an administrator approves it."
          : "The dispute is in progress and still needs resolution or confirmation.",
    clientId: dispute.client?.id ?? "",
    clientName: dispute.client?.companyName ?? "Unknown client",
    projectId: dispute.project?.id ?? "",
    projectName: dispute.project?.name ?? "Unknown project",
    currentPmName: dispute.pm?.name ?? "Unassigned",
    currentPmInitials: buildInitials(dispute.pm?.name),
    reviewerName: dispute.reviewer?.name ?? null,
    resolverName: dispute.resolver?.name ?? null,
    newPmName: dispute.newPm?.name ?? null,
    complaintSummary: dispute.description ?? dispute.title ?? "No complaint summary captured yet.",
    pmHandlingSummary: dispute.resolutionNotes ?? "No PM handling summary recorded yet.",
    currentBlocker: dispute.status === "PENDING_APPROVAL" ? "Waiting admin approval." : dispute.status === "PENDING_CLIENT" ? "Waiting client confirmation." : "No blocker note recorded.",
    recommendedAction: dispute.status === "ESCALATED" ? "Review reassignment or escalation path." : "Continue the current resolution path.",
    resolutionSummary: dispute.resolutionSummary ?? "No final resolution summary yet.",
    clientExpectation: dispute.clientExpectation ?? "Client expectation not separately captured.",
    projectCommercialState: dispute.project?.name ? "Linked to active delivery context." : "No project linkage found.",
    metrics: [
      {
        label: "Messages",
        value: String(dispute.messages?.length ?? 0),
        description: "Conversation entries stored on the dispute.",
      },
      {
        label: "Attachments",
        value: String(dispute.attachments?.length ?? 0),
        description: "Evidence files attached to the dispute.",
      },
      {
        label: "History",
        value: String(dispute.history?.length ?? 0),
        description: "Status or ownership changes recorded on this case.",
      },
      {
        label: "PM avg resolution",
        value: `${dispute.pmStats?.avgResolutionDays ?? 0}d`,
        description: "Average resolution time for the currently assigned PM.",
      },
    ],
    workflow: [
      { key: "approval", label: "Approval", state: dispute.status === "PENDING_APPROVAL" ? "current" : "completed" },
      { key: "active", label: "PM handling", state: ["APPROVED", "IN_PROGRESS", "ESCALATED"].includes(dispute.status) ? "current" : ["PENDING_CLIENT", "RESOLVED", "CLOSED"].includes(dispute.status) ? "completed" : "upcoming" },
      { key: "client", label: "Client confirmation", state: dispute.status === "PENDING_CLIENT" ? "current" : ["RESOLVED", "CLOSED"].includes(dispute.status) ? "completed" : "upcoming" },
      { key: "resolved", label: "Resolved", state: ["RESOLVED", "CLOSED"].includes(dispute.status) ? "current" : "upcoming" },
    ],
    actions: [
      {
        id: "review",
        label: "Review case",
        description: "Inspect the PM path and attached evidence.",
        availability: "Available now",
        tone: "active",
      },
      {
        id: "escalate",
        label: "Escalate",
        description: "Move the case into a higher-priority admin path.",
        availability: dispute.status === "ESCALATED" ? "Already escalated" : "Available when needed",
        tone: dispute.status === "ESCALATED" ? "destructive" : "warning",
      },
    ],
    pmStats: [
      {
        label: "Total disputes",
        value: String(dispute.pmStats?.totalDisputes ?? 0),
        description: "All disputes historically assigned to this PM.",
      },
      {
        label: "Resolved",
        value: String(dispute.pmStats?.resolvedDisputes ?? 0),
        description: "Resolved disputes without further escalation.",
      },
      {
        label: "Escalated",
        value: String(dispute.pmStats?.escalatedDisputes ?? 0),
        description: "Disputes that reached escalation while assigned to this PM.",
      },
      {
        label: "PM changes",
        value: String(dispute.pmStats?.pmChangedCount ?? 0),
        description: "How often the PM assignment changed on prior cases.",
      },
    ],
    messages: (dispute.messages ?? []).map((message: any) => ({
      id: message.id,
      date: formatDateTime(message.createdAt),
      author: message.author?.name ?? "Team",
      role: message.authorType === "CLIENT" ? "Client" : message.isInternal ? "Admin" : "PM",
      visibility: message.isInternal ? "Internal" : "External",
      content: message.content ?? message.message ?? "",
      tone: message.isInternal ? "neutral" : "active",
    })),
    attachments: (dispute.attachments ?? []).map((attachment: any) => ({
      id: attachment.id,
      name: attachment.fileName ?? attachment.name ?? "Attachment",
      source: attachment.filePath ?? "Backend upload",
      type: attachment.fileType ?? "FILE",
      uploadedAt: formatDateTime(attachment.createdAt ?? attachment.uploadedAt),
      uploadedBy: attachment.uploader?.name ?? "Unknown uploader",
      linkedTo: attachment.linkedTo ?? "Dispute",
    })),
    history: (dispute.history ?? []).map((item: any) => ({
      id: item.id,
      date: formatDateTime(item.changedAt),
      title: `${String(item.fromStatus ?? "UNKNOWN").replaceAll("_", " ")} -> ${String(item.toStatus ?? "UNKNOWN").replaceAll("_", " ")}`,
      actor: item.changer?.name ?? "System",
      summary: item.reason ?? "Dispute history entry recorded.",
      tone: mapDisputeStatusTone(item.toStatus),
      completed: true,
    })),
  };
}

export function mapEmployeeDetailFromApi(payload: {
  detail: any;
  performance: any;
  activity: any;
  work: any;
}): {
  employee: EmployeeFixture;
  adminRecord: EmployeeAdminRecord;
} {
  const detail = payload.detail;
  const performance = payload.performance;
  const activityItems = payload.activity?.items ?? [];
  const work = payload.work ?? {};
  const role = (detail.role as UserRole) ?? UserRole.TEAM;

  const currentWork = [
    ...(work.projects ?? []).map((project: any) => ({
      name: project.name,
      type: "Project",
      state: String(project.status ?? "ACTIVE").replaceAll("_", " "),
      due: "Ongoing",
      tone: mapProjectTone(project.status),
    })),
    ...(work.tasks ?? []).map((task: any) => ({
      name: task.title,
      type: "Task",
      state: String(task.status ?? "TODO").replaceAll("_", " "),
      due: "Assigned",
      tone: mapTaskTone(task.status),
    })),
    ...(work.disputes ?? []).map((dispute: any) => ({
      name: dispute.title,
      type: "Dispute",
      state: String(dispute.status ?? "OPEN").replaceAll("_", " "),
      due: String(dispute.priority ?? "NORMAL"),
      tone: mapDisputeStatusTone(dispute.status),
    })),
  ].slice(0, 6);

  const openAssignments = (work.projects?.length ?? 0) + (work.tasks?.length ?? 0) + (work.disputes?.length ?? 0);
  const qualityScore = Math.round((performance.avgQualityScore ?? 0) * 100);
  const employee: EmployeeFixture = {
    id: detail.id,
    name: detail.name,
    initials: buildInitials(detail.name),
    email: detail.email,
    role,
    department: mapDepartmentLabel(detail.role, detail.department),
    workload: `${performance.activeTasksCount ?? 0} active tasks`,
    stateLabel: detail.isActive ? "Active" : "Suspended",
    stateTone: detail.isActive ? "success" : "destructive",
    lastActivity: activityItems[0]?.createdAt ? formatDateTime(activityItems[0].createdAt) : formatDateTime(detail.lastLoginAt),
    headlineSignal:
      openAssignments > 0
        ? `${openAssignments} active ownership item(s) need ongoing attention`
        : "No active ownership items currently assigned",
    performanceSignal:
      performance.avgQualityScore
        ? `${qualityScore}% quality score`
        : `${performance.avgCompletionSpeedDays ?? 0}d avg completion`,
    riskLabel:
      performance.workloadStatus === "OVERLOADED"
        ? "Capacity pressure"
        : (work.disputes?.length ?? 0) > 0
          ? "Dispute watch"
          : "Stable load",
    riskTone:
      performance.workloadStatus === "OVERLOADED"
        ? "warning"
        : (work.disputes?.length ?? 0) > 0
          ? "attention"
          : "success",
    openAssignments,
    accessSummary: {
      roleDefault: `${mapRoleLabel(detail.role)} access is currently applied from the backend role.`,
      inheritedGroups: [mapRoleLabel(detail.role), mapDepartmentLabel(detail.role, detail.department)],
      customExceptions: 0,
      exceptionNote: "No permission exception feed is exposed on this detail endpoint.",
    },
    roleProfile: {
      title: `${mapRoleLabel(detail.role)} performance`,
      summary: `This profile is built from current backend role, workload, and ownership data.`,
      scoreLabel: "Quality score",
      scoreValue: qualityScore || 50,
      metrics: [
        {
          label: "Active tasks",
          value: String(performance.activeTasksCount ?? 0),
          description: "Tasks still active on this employee.",
          tone: "active",
        },
        {
          label: "Workload",
          value: String(performance.workloadStatus ?? "AVAILABLE").replaceAll("_", " "),
          description: "Backend workload classification.",
          tone: performance.workloadStatus === "OVERLOADED" ? "warning" : "success",
        },
        {
          label: "Completion speed",
          value: `${performance.avgCompletionSpeedDays ?? 0}d`,
          description: "Average completion speed in days.",
          tone: "neutral",
        },
        {
          label: "Quality score",
          value: `${qualityScore || 0}%`,
          description: "Average quality score from backend metrics.",
          tone: "success",
        },
      ],
      focusItems: currentWork.slice(0, 2).map((item) => ({
        label: item.type,
        value: item.name,
        description: item.state,
        tone: item.tone,
      })),
    },
    currentWork,
    meaningfulActivities: activityItems.slice(0, 8).map((item: any) => ({
      title: item.action?.replaceAll(".", " ") ?? "Activity",
      description: `${item.entity ?? "entity"} ${item.entityId ?? ""}`.trim(),
      time: formatDateTime(item.createdAt),
      impact: item.action ?? "Backend activity log",
      tone: "neutral",
    })),
  };

  const adminRecord: EmployeeAdminRecord = {
    id: detail.id,
    name: detail.name,
    initials: buildInitials(detail.name),
    email: detail.email,
    role,
    department: detail.department ?? undefined,
    phoneWhatsapp: detail.phoneWhatsapp ?? "",
    lastSeen: employee.lastActivity,
    isActive: !!detail.isActive,
    startDate: detail.createdAt ? formatDate(detail.createdAt) : undefined,
    salary: undefined,
  } satisfies EmployeeWorkspaceRecord & { salary?: number; startDate?: string };

  return { employee, adminRecord };
}
