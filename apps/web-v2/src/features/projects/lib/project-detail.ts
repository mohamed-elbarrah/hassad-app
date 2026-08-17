import {
  DisputePriority,
  DisputeStatus,
  ProjectPeriodStatus,
  ProjectStatus,
  TaskDepartment,
  TaskPriority,
  TaskStatus,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import {
  disputeDirectoryRecords,
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  getDisputePriorityTone,
  getDisputeStatusTone,
} from "@/features/disputes/lib/dispute-directory";
import {
  formatProjectDepartments,
  formatProjectStatus,
  formatMoney,
  formatTimeline,
  projectDirectoryRecords,
  type ProjectDirectoryRecord,
} from "@/features/projects/lib/project-directory";
import {
  clientDirectoryRecords,
} from "@/features/clients/lib/client-directory";
import {
  formatTaskDepartment,
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityTone,
  getTaskStatusTone,
  taskDirectoryRecords,
  type TaskDirectoryRecord,
} from "@/features/tasks/lib/task-directory";

export type ProjectDetailMetric = {
  label: string;
  value: string;
  description: string;
  tone?: StatusTone;
  trendLabel?: string;
};

export type ProjectDetailPeriodRow = {
  id: string;
  label: string;
  status: string;
  statusTone: StatusTone;
  window: string;
  windowShort: string;
  completion: number;
  billing: string;
  focus: string;
  shortDate: string;
  markerLabel?: string;
  tasks: TaskDirectoryRecord[];
  meetings: Array<{
    id: string;
    title: string;
    date: string;
    owner: string;
    note: string;
  }>;
  files: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  invoices: ProjectDetailFinanceRow[];
  history: ProjectDetailHistoryRow[];
  disputes: typeof disputeDirectoryRecords;
};

export type ProjectDetailFinanceRow = {
  id: string;
  item: string;
  type: string;
  status: string;
  statusTone: StatusTone;
  amount: string;
  due: string;
  owner: string;
};

export type ProjectDetailTeamRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  workload: string;
  focus: string;
  tone: StatusTone;
};

export type ProjectDetailHistoryRow = {
  id: string;
  date: string;
  title: string;
  summary: string;
  meta: string;
  tone: StatusTone;
  completed?: boolean;
};

export type ProjectDetailRecord = {
  id: string;
  name: string;
  clientName: string;
  clientId: string | null;
  projectManager: string;
  projectManagerEmail: string;
  status: string;
  statusTone: StatusTone;
  healthLabel: string;
  healthTone: StatusTone;
  archived: boolean;
  modelLabel: string;
  priorityLabel: string;
  startDate: string;
  endDate: string;
  timelineLabel: string;
  departmentsLabel: string;
  totalValue: string;
  remainingValue: string;
  currentPeriodLabel: string;
  currentPeriodStatusLabel: string;
  currentPeriodStatusTone: StatusTone;
  metrics: ProjectDetailMetric[];
  periods: ProjectDetailPeriodRow[];
  taskRows: TaskDirectoryRecord[];
  financeRows: ProjectDetailFinanceRow[];
  disputeRows: typeof disputeDirectoryRecords;
  teamRows: ProjectDetailTeamRow[];
  historyRows: ProjectDetailHistoryRow[];
  meetingRows: Array<{
    id: string;
    title: string;
    date: string;
    owner: string;
    note: string;
  }>;
  fileRows: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  pmOptions: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

const pmDirectory = [
  {
    id: "pm-mona-saleh",
    name: "Mona Saleh",
    email: "mona.saleh@hassad.com",
  },
  {
    id: "pm-fadi-kareem",
    name: "Fadi Kareem",
    email: "fadi.kareem@hassad.com",
  },
  {
    id: "pm-rania-hassan",
    name: "Rania Hassan",
    email: "rania.hassan@hassad.com",
  },
] as const;

const periodStatusLabel: Record<ProjectPeriodStatus, string> = {
  [ProjectPeriodStatus.UPCOMING]: "Upcoming",
  [ProjectPeriodStatus.ACTIVE]: "Active",
  [ProjectPeriodStatus.CLOSED]: "Closed",
  [ProjectPeriodStatus.SUSPENDED]: "Suspended",
};

const periodStatusTone: Record<ProjectPeriodStatus, StatusTone> = {
  [ProjectPeriodStatus.UPCOMING]: "attention",
  [ProjectPeriodStatus.ACTIVE]: "active",
  [ProjectPeriodStatus.CLOSED]: "success",
  [ProjectPeriodStatus.SUSPENDED]: "destructive",
};

function getProjectManagerEmail(projectManager: string) {
  return (
    pmDirectory.find((pm) => pm.name === projectManager)?.email ??
    `${projectManager.toLowerCase().replaceAll(" ", ".")}@hassad.com`
  );
}

function getClientId(clientName: string) {
  return (
    clientDirectoryRecords.find((client) => client.companyName === clientName)?.id ?? null
  );
}

function getModelLabel(project: ProjectDirectoryRecord) {
  return project.model === "recurring" ? "Recurring retainer" : "One-off delivery";
}

function formatDateRange(
  startDate: Date,
  endDate: Date,
  format: "short" | "long",
) {
  const shortFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const longFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formatter = format === "short" ? shortFormatter : longFormatter;

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getPeriodDateRange(project: ProjectDirectoryRecord, index: number) {
  const projectStart = new Date(project.startDate);

  if (project.model === "one-off" || project.totalPeriods === 0) {
    return {
      start: new Date(project.startDate),
      end: new Date(project.endDate),
    };
  }

  const start = addMonths(projectStart, index - 1);
  const nextPeriodStart = addMonths(projectStart, index);
  const end = addDays(nextPeriodStart, -1);

  return { start, end };
}

function buildPeriodMeetings(project: ProjectDirectoryRecord, label: string) {
  return [
    {
      id: `${project.id}-${label}-meeting-review`,
      title: `${label} delivery review`,
      date: "Aug 10, 2026 · 10:00",
      owner: project.projectManager,
      note: "Review delivery progress, approvals, and blockers inside this period.",
    },
    {
      id: `${project.id}-${label}-meeting-client`,
      title: `${label} client checkpoint`,
      date: "Aug 12, 2026 · 14:30",
      owner: project.projectManager,
      note:
        project.model === "recurring"
          ? "Align on the current monthly scope and billing close."
          : "Confirm the remaining delivery scope before final handoff.",
    },
  ];
}

function buildPeriodFiles(project: ProjectDirectoryRecord, label: string) {
  return [
    {
      id: `${project.id}-${label}-file-brief`,
      name: `${label} scope summary.pdf`,
      type: "Scope brief",
      uploadedAt: "Aug 5, 2026",
      uploadedBy: project.projectManager,
    },
    {
      id: `${project.id}-${label}-file-pack`,
      name: `${label} delivery pack.zip`,
      type: "Delivery asset",
      uploadedAt: "Aug 7, 2026",
      uploadedBy: "Alaa Samir",
    },
  ];
}

function buildPeriodHistory(
  project: ProjectDirectoryRecord,
  label: string,
  focus: string,
  statusTone: StatusTone,
  completed: boolean,
): ProjectDetailHistoryRow[] {
  return [
    {
      id: `${project.id}-${label}-history-open`,
      date: "Aug 1, 2026",
      title: `${label} opened`,
      summary: `${label} scope was activated for the delivery team.`,
      meta: project.clientName,
      tone: completed ? "success" : "active",
      completed: true,
    },
    {
      id: `${project.id}-${label}-history-signal`,
      date: "Aug 7, 2026",
      title: `${label} operating signal`,
      summary: focus,
      meta: `${project.healthLabel} queue`,
      tone: statusTone,
      completed,
    },
  ];
}

function buildPeriodInvoices(
  project: ProjectDirectoryRecord,
  label: string,
  amount: number,
  status: string,
  statusTone: StatusTone,
): ProjectDetailFinanceRow[] {
  return [
    {
      id: `${project.id}-${label}-invoice-main`,
      item: `${label} invoice`,
      type: "Invoice",
      status,
      statusTone,
      amount: formatMoney(amount),
      due: project.model === "recurring" ? "Period close" : project.endDate,
      owner: "Finance",
    },
  ];
}

function getPeriodRows(
  project: ProjectDirectoryRecord,
  taskRows: TaskDirectoryRecord[],
  disputeRows: typeof disputeDirectoryRecords,
): ProjectDetailPeriodRow[] {
  if (project.model === "one-off") {
    const label = "Delivery window";
    const focus =
      project.openRevisions > 0
        ? `${project.openRevisions} revision rounds still open`
        : `${project.deliverablesWaitingReview} deliverables waiting review`;
    const oneOffStart = new Date(project.startDate);
    const oneOffEnd = new Date(project.endDate);

    return [
      {
        id: `${project.id}-delivery-window`,
        label,
        status: "Active",
        statusTone: project.healthTone === "destructive" ? "destructive" : "active",
        window: formatDateRange(oneOffStart, oneOffEnd, "long"),
        windowShort: formatDateRange(oneOffStart, oneOffEnd, "short"),
        completion: project.completionPercentage,
        billing: formatMoney(project.totalValue),
        focus,
        shortDate: formatDateRange(oneOffStart, oneOffEnd, "short"),
        markerLabel: "Current",
        tasks: taskRows,
        meetings: buildPeriodMeetings(project, label),
        files: buildPeriodFiles(project, label),
        invoices: buildPeriodInvoices(
          project,
          label,
          project.remainingValue || project.totalValue,
          project.remainingValue > 0 ? "Open" : "Collected",
          project.remainingValue > 0 ? "warning" : "success",
        ),
        history: buildPeriodHistory(project, label, focus, project.healthTone, false),
        disputes: disputeRows,
      },
    ];
  }

  const rows: ProjectDetailPeriodRow[] = [];

  for (let index = 1; index <= project.totalPeriods; index += 1) {
    const isCurrent = index === project.periodsCompleted + 1;
    const isClosed = index <= project.periodsCompleted;
    const range = getPeriodDateRange(project, index);
    const status = isClosed
      ? ProjectPeriodStatus.CLOSED
      : isCurrent
        ? project.currentPeriodStatusLabel === "Suspended"
          ? ProjectPeriodStatus.SUSPENDED
          : project.currentPeriodStatusLabel === "Upcoming"
            ? ProjectPeriodStatus.UPCOMING
            : ProjectPeriodStatus.ACTIVE
        : ProjectPeriodStatus.UPCOMING;

    const completion = isClosed
      ? 100
      : isCurrent
        ? project.completionPercentage
        : 0;
    const label = `Period ${index}`;
    const focus = isCurrent
      ? project.healthSummary
      : isClosed
        ? "Closed and billed"
        : "Queued after current delivery period";
    const periodTaskRows = taskRows.filter((task) => {
      if (task.periodLabel.toLowerCase() === "one-off") return index === 1;
      return task.periodLabel === `P${index}/${project.totalPeriods}`;
    });
    const amount = Math.round(project.totalValue / project.totalPeriods);
    const invoiceStatus = isClosed
      ? "Collected"
      : isCurrent
        ? "Queued"
        : "Draft";
    const invoiceTone = isClosed ? "success" : isCurrent ? "active" : "neutral";

    rows.push({
      id: `${project.id}-period-${index}`,
      label,
      status: periodStatusLabel[status],
      statusTone: periodStatusTone[status],
      window: formatDateRange(range.start, range.end, "long"),
      windowShort: formatDateRange(range.start, range.end, "short"),
      completion,
      billing: formatMoney(amount),
      focus,
      shortDate: formatDateRange(range.start, range.end, "short"),
      markerLabel: isCurrent ? "Current" : undefined,
      tasks: periodTaskRows,
      meetings: buildPeriodMeetings(project, label),
      files: buildPeriodFiles(project, label),
      invoices: buildPeriodInvoices(project, label, amount, invoiceStatus, invoiceTone),
      history: buildPeriodHistory(project, label, focus, periodStatusTone[status], isClosed),
      disputes: isCurrent ? disputeRows : [],
    });
  }

  return rows;
}

function buildFinanceRows(project: ProjectDirectoryRecord): ProjectDetailFinanceRow[] {
  const paidAmount = project.totalValue - project.remainingValue;
  const nextInvoiceAmount =
    project.model === "recurring" && project.totalPeriods > 0
      ? Math.round(project.totalValue / project.totalPeriods)
      : project.remainingValue;

  const rows: ProjectDetailFinanceRow[] = [
    {
      id: `${project.id}-finance-paid`,
      item: "Closed billing",
      type: "Revenue",
      status: paidAmount > 0 ? "Collected" : "Not billed yet",
      statusTone: paidAmount > 0 ? "success" : "attention",
      amount: formatMoney(paidAmount),
      due: paidAmount > 0 ? "Paid" : project.startDate,
      owner: "Finance",
    },
    {
      id: `${project.id}-finance-open`,
      item: "Remaining contract value",
      type: "Open value",
      status: project.remainingValue > 0 ? "Open" : "Settled",
      statusTone: project.remainingValue > 0 ? "warning" : "success",
      amount: formatMoney(project.remainingValue),
      due: project.model === "recurring" ? "Next period close" : project.endDate,
      owner: "Finance",
    },
  ];

  if (project.remainingValue > 0) {
    rows.push({
      id: `${project.id}-finance-next`,
      item: "Next invoice",
      type: "Invoice",
      status: project.status === ProjectStatus.PENDING_ACTIVATION ? "Blocked" : "Queued",
      statusTone: project.status === ProjectStatus.PENDING_ACTIVATION ? "attention" : "active",
      amount: formatMoney(nextInvoiceAmount),
      due: project.model === "recurring" ? "At next period close" : project.endDate,
      owner: "Finance",
    });
  }

  return rows;
}

function buildTeamRows(project: ProjectDirectoryRecord): ProjectDetailTeamRow[] {
  const rows: ProjectDetailTeamRow[] = [
    {
      id: `${project.id}-pm`,
      name: project.projectManager,
      role: "Project Manager",
      department: "Project Management",
      workload: `${project.teamSize} active contributors`,
      focus: project.healthSummary,
      tone: project.healthTone,
    },
  ];

  project.assignedDepartments.forEach((department, index) => {
    rows.push({
      id: `${project.id}-department-${department}`,
      name: `${formatTaskDepartment(department)} lead`,
      role: "Department lead",
      department: formatTaskDepartment(department),
      workload: `${Math.max(1, Math.ceil(project.teamSize / (index + 2)))} active items`,
      focus:
        department === TaskDepartment.DESIGN
          ? "Creative approvals and asset delivery"
          : department === TaskDepartment.CONTENT
            ? "Copy, scripts, and review rounds"
            : department === TaskDepartment.DEVELOPMENT
              ? "Technical setup and launch support"
              : department === TaskDepartment.MARKETING
                ? "Media execution and performance follow-up"
                : "Production and packaging handoff",
      tone: index === 0 && project.healthTone !== "success" ? project.healthTone : "neutral",
    });
  });

  return rows;
}

function buildHistoryRows(project: ProjectDirectoryRecord): ProjectDetailHistoryRow[] {
  const rows: ProjectDetailHistoryRow[] = [
    {
      id: `${project.id}-history-start`,
      date: project.startDate,
      title: "Project opened",
      summary: `${project.name} moved into ${formatProjectStatus(project.status).toLowerCase()} delivery.`,
      meta: `${project.clientName} · ${getModelLabel(project)}`,
      tone: "success",
      completed: true,
    },
  ];

  if (project.model === "recurring" && project.periodsCompleted > 0) {
    rows.push({
      id: `${project.id}-history-period-close`,
      date: "Jul 31, 2026",
      title: `Period ${project.periodsCompleted} closed`,
      summary: "Delivery close completed and finance handed off the billing window.",
      meta: `${project.periodsCompleted} of ${project.totalPeriods} periods complete`,
      tone: "success",
      completed: true,
    });
  }

  if (project.overdueTasks > 0 || project.openRevisions > 0) {
    rows.push({
      id: `${project.id}-history-risk`,
      date: "Aug 6, 2026",
      title: "Admin watch raised",
      summary: project.healthSummary,
      meta: `${project.overdueTasks} overdue tasks · ${project.openRevisions} revisions`,
      tone: project.healthTone,
    });
  }

  if (project.deliverablesWaitingReview > 0) {
    rows.push({
      id: `${project.id}-history-review`,
      date: "Aug 8, 2026",
      title: "Client or PM review pending",
      summary: `${project.deliverablesWaitingReview} deliverables are still waiting for a review decision.`,
      meta: "Review queue",
      tone: "warning",
    });
  }

  return rows;
}

function buildMeetingRows(project: ProjectDirectoryRecord) {
  return [
    {
      id: `${project.id}-meeting-1`,
      title: "Weekly delivery review",
      date: "Aug 10, 2026 · 10:00",
      owner: project.projectManager,
      note: "Review overdue items, approvals, and client blockers.",
    },
    {
      id: `${project.id}-meeting-2`,
      title: "Client checkpoint",
      date: "Aug 12, 2026 · 14:30",
      owner: project.projectManager,
      note:
        project.model === "recurring"
          ? "Confirm current period scope and next billing checkpoint."
          : "Confirm final delivery scope and launch readiness.",
    },
  ];
}

function buildFileRows(project: ProjectDirectoryRecord) {
  return [
    {
      id: `${project.id}-file-1`,
      name: "Scope summary.pdf",
      type: "Project brief",
      uploadedAt: "Aug 5, 2026",
      uploadedBy: project.projectManager,
    },
    {
      id: `${project.id}-file-2`,
      name: "Latest delivery pack.zip",
      type: "Delivery asset",
      uploadedAt: "Aug 7, 2026",
      uploadedBy: "Alaa Samir",
    },
  ];
}

function buildMetrics(
  project: ProjectDirectoryRecord,
  taskRows: TaskDirectoryRecord[],
  disputeRows: typeof disputeDirectoryRecords,
): ProjectDetailMetric[] {
  const activeTasks = taskRows.filter((task) =>
    [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.REVISION].includes(
      task.status,
    ),
  ).length;
  const reviewLoad = taskRows.filter(
    (task) => task.status === TaskStatus.IN_REVIEW || task.status === TaskStatus.REVISION,
  ).length;

  return [
    {
      label: "Delivery progress",
      value: `${project.completionPercentage}%`,
      description: `${project.periodsCompleted} closed periods and current work in motion`,
      tone: project.healthTone,
      trendLabel: project.healthLabel,
    },
    {
      label: "Open work",
      value: String(activeTasks),
      description: `${project.overdueTasks} overdue and ${reviewLoad} in review`,
      tone: project.overdueTasks > 0 ? "warning" : "success",
      trendLabel: project.overdueTasks > 0 ? "Needs follow-up" : "Healthy queue",
    },
    {
      label: "Finance left",
      value: formatMoney(project.remainingValue),
      description: `${formatMoney(project.totalValue)} total contract value`,
      tone: project.remainingValue > 0 ? "attention" : "success",
      trendLabel: project.remainingValue > 0 ? "Still open" : "Settled",
    },
    {
      label: "Disputes",
      value: String(disputeRows.length),
      description:
        disputeRows.length > 0
          ? `${disputeRows.filter((row) => row.status !== DisputeStatus.CLOSED).length} still active`
          : "No open dispute tickets",
      tone: disputeRows.some((row) => row.priority === DisputePriority.URGENT)
        ? "destructive"
        : disputeRows.length > 0
          ? "warning"
          : "success",
      trendLabel: disputeRows.length > 0 ? "Needs watch" : "Clean",
    },
  ];
}

function buildProjectDetail(project: ProjectDirectoryRecord): ProjectDetailRecord {
  const taskRows = taskDirectoryRecords.filter((task) => task.projectId === project.id);
  const disputeRows = disputeDirectoryRecords.filter(
    (dispute) => dispute.projectName === project.name,
  );
  const periods = getPeriodRows(project, taskRows, disputeRows);
  const financeRows = buildFinanceRows(project);
  const teamRows = buildTeamRows(project);
  const historyRows = buildHistoryRows(project);

  return {
    id: project.id,
    name: project.name,
    clientName: project.clientName,
    clientId: getClientId(project.clientName),
    projectManager: project.projectManager,
    projectManagerEmail: getProjectManagerEmail(project.projectManager),
    status: formatProjectStatus(project.status),
    statusTone: project.statusTone,
    healthLabel: project.healthLabel,
    healthTone: project.healthTone,
    archived: project.archived,
    modelLabel: getModelLabel(project),
    priorityLabel: formatTaskPriority(project.priority),
    startDate: project.startDate,
    endDate: project.endDate,
    timelineLabel: formatTimeline(project.daysToEnd, project.endDate),
    departmentsLabel: formatProjectDepartments(project.assignedDepartments),
    totalValue: formatMoney(project.totalValue),
    remainingValue: formatMoney(project.remainingValue),
    currentPeriodLabel: project.currentPeriodLabel,
    currentPeriodStatusLabel: project.currentPeriodStatusLabel,
    currentPeriodStatusTone: project.currentPeriodStatusTone,
    metrics: buildMetrics(project, taskRows, disputeRows),
    periods,
    taskRows,
    financeRows,
    disputeRows,
    teamRows,
    historyRows,
    meetingRows: buildMeetingRows(project),
    fileRows: buildFileRows(project),
    pmOptions: [...pmDirectory],
  };
}

const projectDetailRecords = projectDirectoryRecords.map(buildProjectDetail);

export function getProjectDetailById(projectId: string) {
  return projectDetailRecords.find((project) => project.id === projectId) ?? null;
}

export function getProjectDetailStatusTone(status: ProjectStatus) {
  if (status === ProjectStatus.ACTIVE) return "active";
  if (status === ProjectStatus.COMPLETED) return "success";
  if (status === ProjectStatus.ON_HOLD) return "warning";
  if (status === ProjectStatus.CANCELLED) return "destructive";
  if (status === ProjectStatus.NEEDS_REVISION) return "attention";
  if (status === ProjectStatus.AWAITING_REVIEW) return "warning";
  return "neutral";
}

export function getProjectTaskPreviewTone(task: TaskDirectoryRecord) {
  return getTaskStatusTone(task.status) ?? getTaskPriorityTone(task.priority);
}

export function getProjectDisputeTone(status: DisputeStatus, priority: DisputePriority) {
  return getDisputePriorityTone(priority) === "destructive"
    ? "destructive"
    : getDisputeStatusTone(status);
}

export {
  formatDisputeCategory,
  formatDisputePriority,
  formatDisputeStatus,
  formatTaskDepartment,
  formatTaskPriority,
  formatTaskStatus,
  getDisputePriorityTone,
  getDisputeStatusTone,
  getTaskPriorityTone,
  getTaskStatusTone,
};
