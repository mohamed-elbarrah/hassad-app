"use client";

import {
  ContractStatus,
  ContractType,
  DisputeCategory,
  DisputePriority,
  DisputeStatus,
  ProjectStatus,
  ProposalStatus,
  TaskDepartment,
  TaskPriority,
  TaskStatus,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import type { ContractDirectoryRecord } from "@/features/crm-contracts/lib/contract-directory";
import type { ProposalDirectoryRecord } from "@/features/crm-proposals/lib/proposal-directory";
import type { DisputeDirectoryRecord } from "@/features/disputes/lib/dispute-directory";
import type { TaskDirectoryRecord } from "@/features/tasks/lib/task-directory";

const TODAY = new Date("2026-08-09T00:00:00Z");

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRelativePastLabel(value?: string | null, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const days = Math.floor((TODAY.getTime() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - TODAY.getTime()) / 86400000);
}

function dueLabel(value?: string | null) {
  const diff = daysUntil(value);
  if (diff === null) return "No due date";
  if (diff === 0) return "Today";
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  return formatDate(value);
}

function mapTaskDepartmentValue(value?: string | null): TaskDepartment {
  if (!value) return TaskDepartment.DESIGN;
  const normalized = value.toUpperCase();
  if (Object.values(TaskDepartment).includes(normalized as TaskDepartment)) {
    return normalized as TaskDepartment;
  }
  return TaskDepartment.DESIGN;
}

function mapTaskPriorityValue(value?: string | null): TaskPriority {
  if (!value) return TaskPriority.NORMAL;
  if (Object.values(TaskPriority).includes(value as TaskPriority)) {
    return value as TaskPriority;
  }
  return TaskPriority.NORMAL;
}

function mapTaskStatusValue(value?: string | null): TaskStatus {
  if (!value) return TaskStatus.TODO;
  if (Object.values(TaskStatus).includes(value as TaskStatus)) {
    return value as TaskStatus;
  }
  return TaskStatus.TODO;
}

function mapProjectStatusValue(value?: string | null): ProjectStatus {
  if (!value) return ProjectStatus.PLANNING;
  if (Object.values(ProjectStatus).includes(value as ProjectStatus)) {
    return value as ProjectStatus;
  }
  return ProjectStatus.PLANNING;
}

function taskSignal(item: any): {
  label: string;
  summary: string;
  tone: StatusTone;
} {
  if (!item.assigneeName || item.assigneeName === "—") {
    return {
      label: "Unassigned",
      summary: "This task still has no assignee.",
      tone: "destructive",
    };
  }
  if (item.isOverdue) {
    return {
      label: "Overdue",
      summary: "The due date already passed while work is still open.",
      tone: "destructive",
    };
  }
  if ((item.revisionCount ?? 0) > 0 || item.status === TaskStatus.REVISION) {
    return {
      label: "Revision",
      summary: "The task is already in a revision loop.",
      tone: "attention",
    };
  }
  if (item.status === TaskStatus.IN_REVIEW) {
    return {
      label: "Review",
      summary: "The task is currently waiting for review.",
      tone: "warning",
    };
  }
  return {
    label: "On track",
    summary: "No immediate delivery risk is visible on this task.",
    tone: "success",
  };
}

function mapContractStatusValue(value?: string | null): ContractStatus {
  if (!value) return ContractStatus.DRAFT;
  if (Object.values(ContractStatus).includes(value as ContractStatus)) {
    return value as ContractStatus;
  }
  return ContractStatus.DRAFT;
}

function mapContractTypeValue(value?: string | null): ContractType {
  if (!value) return ContractType.FIXED_PROJECT;
  if (Object.values(ContractType).includes(value as ContractType)) {
    return value as ContractType;
  }
  return ContractType.FIXED_PROJECT;
}

function mapProposalStatusValue(value?: string | null): ProposalStatus {
  if (!value) return ProposalStatus.DRAFT;
  if (Object.values(ProposalStatus).includes(value as ProposalStatus)) {
    return value as ProposalStatus;
  }
  return ProposalStatus.DRAFT;
}

function mapDisputeStatusValue(value?: string | null): DisputeStatus {
  if (!value) return DisputeStatus.IN_PROGRESS;
  if (Object.values(DisputeStatus).includes(value as DisputeStatus)) {
    return value as DisputeStatus;
  }
  return DisputeStatus.IN_PROGRESS;
}

function mapDisputeCategoryValue(value?: string | null): DisputeCategory {
  if (!value) return DisputeCategory.OTHER;
  if (Object.values(DisputeCategory).includes(value as DisputeCategory)) {
    return value as DisputeCategory;
  }
  return DisputeCategory.OTHER;
}

function mapDisputePriorityValue(value?: string | null): DisputePriority {
  if (!value) return DisputePriority.NORMAL;
  if (Object.values(DisputePriority).includes(value as DisputePriority)) {
    return value as DisputePriority;
  }
  return DisputePriority.NORMAL;
}

export function mapTaskIndexItem(item: any): TaskDirectoryRecord {
  const status = mapTaskStatusValue(item.status);
  const priority = mapTaskPriorityValue(item.priority);
  const signal = taskSignal(item);
  return {
    id: item.id,
    title: item.title ?? "Task",
    projectId: item.projectId ?? "",
    projectName: item.projectName ?? "—",
    clientName: item.clientName ?? "—",
    projectStatus: mapProjectStatusValue(item.projectStatus),
    department: mapTaskDepartmentValue(item.department),
    assigneeName:
      item.assigneeName && item.assigneeName !== "—" ? item.assigneeName : null,
    status,
    priority,
    dueDateLabel: dueLabel(item.dueDate),
    dueOffsetDays: daysUntil(item.dueDate) ?? 0,
    periodLabel: item.periodNumber ? `P${item.periodNumber}` : item.periodLabel ?? "No period",
    isClientVisible: !!item.isVisibleToClient,
    isArchived: !!item.isArchived,
    revisionCount: item.revisionCount ?? 0,
    signalLabel: signal.label,
    signalSummary: signal.summary,
    signalTone: signal.tone,
  };
}

export function mapDisputeIndexItem(item: any): DisputeDirectoryRecord {
  const status = mapDisputeStatusValue(item.status);
  const priority = mapDisputePriorityValue(item.priority);
  const updatedAt = item.updatedAt ?? item.openedAt;
  const staleDays = Math.max(
    0,
    Math.floor((TODAY.getTime() - new Date(updatedAt).getTime()) / 86400000),
  );
  let signalLabel = "Active case";
  let signalSummary = "This dispute still needs action or confirmation.";
  let signalTone: StatusTone = "active";

  if (status === DisputeStatus.PENDING_APPROVAL) {
    signalLabel = "Needs approval";
    signalSummary = "Admin approval is required before the PM can proceed.";
    signalTone = "destructive";
  } else if (status === DisputeStatus.ESCALATED) {
    signalLabel = "Escalated";
    signalSummary = "The case has already escalated and needs intervention.";
    signalTone = "destructive";
  } else if (status === DisputeStatus.PENDING_CLIENT) {
    signalLabel = "Waiting client";
    signalSummary = "The proposed resolution is pending client confirmation.";
    signalTone = "attention";
  } else if ([DisputeStatus.RESOLVED, DisputeStatus.CLOSED].includes(status)) {
    signalLabel = status === DisputeStatus.CLOSED ? "Closed" : "Ready to close";
    signalSummary = "The dispute is no longer active.";
    signalTone = status === DisputeStatus.RESOLVED ? "success" : "neutral";
  } else if (staleDays >= 3) {
    signalLabel = "Stale";
    signalSummary = "The dispute has not moved recently and needs follow-up.";
    signalTone = "warning";
  }

  return {
    id: item.id,
    ticketNumber: item.ticketNumber ?? item.id,
    title: item.title ?? "Dispute",
    clientName: item.client?.companyName ?? "—",
    projectName: item.project?.name ?? "—",
    pmName: item.pm?.name ?? "Unassigned",
    category: mapDisputeCategoryValue(item.category),
    priority,
    status,
    openedAtLabel: formatRelativePastLabel(item.openedAt, formatDate(item.openedAt)),
    lastActivityLabel: formatRelativePastLabel(updatedAt, formatDate(updatedAt)),
    staleDays,
    signalLabel,
    signalSummary,
    signalTone,
  };
}

export function mapContractIndexItem(item: any): ContractDirectoryRecord {
  const status = mapContractStatusValue(item.status);
  const type = mapContractTypeValue(item.type);
  const endingInDays = daysUntil(item.endDate);
  const renewalTone: StatusTone =
    endingInDays !== null && endingInDays < 0
      ? "destructive"
      : endingInDays !== null && endingInDays <= 30
        ? "warning"
        : "neutral";
  const projectTone: StatusTone = item.project
    ? item.project.status === "COMPLETED"
      ? "neutral"
      : item.project.status === "ACTIVE"
        ? "success"
        : "attention"
    : "neutral";

  return {
    id: item.id,
    title: item.title ?? "Contract",
    clientName: item.clientName ?? "—",
    type,
    typeLabel: String(type).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    status,
    statusTone:
      status === ContractStatus.ACTIVE
        ? "success"
        : status === ContractStatus.SENT
          ? "warning"
          : [ContractStatus.CANCELLED, ContractStatus.EXPIRED].includes(status)
            ? "destructive"
            : status === ContractStatus.ON_HOLD
              ? "attention"
              : "neutral",
    totalValue: item.totalValue ?? 0,
    monthlyValue: item.monthlyValue ?? null,
    signedLabel: item.signedAt ? `Signed ${formatDate(item.signedAt)}` : `Created ${formatDate(item.createdAt)}`,
    endLabel: item.endDate ? `Ends ${formatDate(item.endDate)}` : "No end date",
    renewalLabel:
      endingInDays === null
        ? "No renewal"
        : endingInDays < 0
          ? `Expired ${formatDate(item.endDate)}`
          : endingInDays <= 30
            ? `${endingInDays}d renewal`
            : "No renewal",
    renewalTone,
    projectLabel: item.project ? "Project linked" : "No project",
    projectTone,
    invoiceLabel:
      item.invoiceCount > 0
        ? `${item.invoiceCount} invoice${item.invoiceCount === 1 ? "" : "s"}`
        : "No invoices",
    invoiceTone: item.invoiceCount > 0 ? "warning" : "neutral",
    endingInDays,
    eSigned: !!item.eSigned,
  };
}

export function mapProposalIndexItem(item: any): ProposalDirectoryRecord {
  const status = mapProposalStatusValue(item.status);
  const serviceNames =
    item.request?.services
      ?.map((service: any) => service.service?.name)
      .filter(Boolean) ?? [];
  const validUntil = item.sentAt
    ? new Date(new Date(item.sentAt).getTime() + (item.offerValidityDays ?? 30) * 86400000)
    : null;
  const validityDaysLeft = validUntil
    ? Math.ceil((validUntil.getTime() - TODAY.getTime()) / 86400000)
    : 999;

  return {
    id: item.id,
    title: item.title ?? "Proposal",
    clientName: item.client?.companyName ?? item.lead?.companyName ?? "—",
    requestName: item.request?.companyName ?? item.lead?.companyName ?? "—",
    creator: item.creator?.name ?? "—",
    servicesCount: serviceNames.length,
    servicesLabel: serviceNames.join(", "),
    totalValue: item.totalPrice ?? 0,
    status,
    statusTone:
      status === ProposalStatus.APPROVED
        ? "success"
        : status === ProposalStatus.REJECTED
          ? "destructive"
          : status === ProposalStatus.REVISION_REQUESTED
            ? "attention"
            : status === ProposalStatus.SENT
              ? "warning"
              : "neutral",
    sentAtLabel: item.sentAt ? `Sent ${formatRelativePastLabel(item.sentAt)}` : "Not sent",
    sentDaysAgo: item.sentAt
      ? Math.max(0, Math.floor((TODAY.getTime() - new Date(item.sentAt).getTime()) / 86400000))
      : 0,
    responseLabel: String(status).replaceAll("_", " "),
    validUntilLabel: validUntil ? `Valid until ${formatDate(validUntil.toISOString())}` : "Validity not started",
    validityDaysLeft,
    validityTone:
      !validUntil
        ? "neutral"
        : validityDaysLeft < 0
          ? "destructive"
          : validityDaysLeft <= 7
            ? "warning"
            : "success",
    contractLabel: item.contract ? "Linked to contract" : "Not created",
    contractTone: item.contract ? "success" : "neutral",
  };
}
