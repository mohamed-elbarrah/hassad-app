import {
  MarketingStrategyStatus,
  ProjectStatus,
  TaskDepartment,
  TaskPriority,
  TaskStatus,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";
import {
  clientDirectoryRecords,
  formatClientStage,
  formatMoney,
} from "@/features/clients/lib/client-directory";
import {
  projectDirectoryRecords,
  formatProjectStatus,
} from "@/features/projects/lib/project-directory";
import {
  formatTaskDepartment,
  formatTaskPriority,
  formatTaskStatus,
  getTaskPriorityTone,
  getTaskStatusTone,
  taskDirectoryRecords,
  type TaskDirectoryRecord,
} from "@/features/tasks/lib/task-directory";
import type { WorkflowStep } from "@/components/patterns/workflow-stepper";

export type TaskDetailComment = {
  id: string;
  senderId: string;
  author: string;
  role: "PM" | "Assignee" | "Admin";
  audience: "Team" | "Internal";
  postedAt: string;
  message: string;
  tone: StatusTone;
};

export type TaskDetailFile = {
  id: string;
  name: string;
  purpose: string;
  uploadedAt: string;
  uploadedBy: string;
  mime: string;
};

export type TaskDetailHistory = {
  id: string;
  date: string;
  title: string;
  summary: string;
  actor: string;
  tone: StatusTone;
  completed?: boolean;
};

export type TaskMarketingExtension = {
  strategyId: string;
  status: MarketingStrategyStatus;
  statusLabel: string;
  statusTone: StatusTone;
  fileName: string;
  updatedAt: string;
  sentAt?: string;
  approvedAt?: string;
  revisionNote?: string;
  campaignReadiness: string;
  campaignReadinessTone: StatusTone;
  campaigns: Array<{
    id: string;
    name: string;
    platform: string;
    owner: string;
    status: string;
    statusTone: StatusTone;
    budget: string;
    spend: string;
    wonValue: string;
    performanceLabel: string;
    launchedAt: string;
    snapshot: Array<{
      label: string;
      value: string;
      helper: string;
    }>;
    rows: Array<{
      label: string;
      value: string;
    }>;
  }>;
};

export type TaskDetailRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  statusLabel: string;
  statusTone: StatusTone;
  priority: TaskPriority;
  priorityLabel: string;
  priorityTone: StatusTone;
  department: TaskDepartment;
  departmentLabel: string;
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  projectStatusLabel: string;
  projectStatusTone: StatusTone;
  clientId: string | null;
  clientName: string;
  clientStageLabel: string | null;
  clientStageTone: StatusTone;
  assigneeName: string | null;
  assigneeInitials: string;
  projectManager: string;
  dueDateLabel: string;
  dueDateValue: string;
  periodLabel: string;
  isClientVisible: boolean;
  revisionCount: number;
  isArchived: boolean;
  signalLabel: string;
  signalSummary: string;
  signalTone: StatusTone;
  workflow: WorkflowStep[];
  metrics: Array<{
    label: string;
    value: string;
    description: string;
    trend?: { label: string; tone: StatusTone };
  }>;
  clientSummary: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
  comments: TaskDetailComment[];
  files: TaskDetailFile[];
  history: TaskDetailHistory[];
  marketing?: TaskMarketingExtension;
};

const marketingStatusLabels: Record<MarketingStrategyStatus, string> = {
  [MarketingStrategyStatus.DRAFT]: "Draft",
  [MarketingStrategyStatus.SENT]: "Sent to client",
  [MarketingStrategyStatus.APPROVED]: "Approved",
  [MarketingStrategyStatus.REVISION_REQUESTED]: "Revision requested",
  [MarketingStrategyStatus.REJECTED]: "Rejected",
};

function getProjectStatusTone(status: ProjectStatus): StatusTone {
  if (status === ProjectStatus.ACTIVE) return "active";
  if (status === ProjectStatus.COMPLETED) return "success";
  if (status === ProjectStatus.PENDING_ACTIVATION) return "attention";
  if (status === ProjectStatus.ON_HOLD) return "warning";
  if (status === ProjectStatus.NEEDS_REVISION) return "attention";
  if (status === ProjectStatus.AWAITING_REVIEW) return "warning";
  return "neutral";
}

function getMarketingStatusTone(status: MarketingStrategyStatus): StatusTone {
  if (status === MarketingStrategyStatus.APPROVED) return "success";
  if (status === MarketingStrategyStatus.SENT) return "active";
  if (status === MarketingStrategyStatus.REVISION_REQUESTED) return "warning";
  if (status === MarketingStrategyStatus.REJECTED) return "destructive";
  return "neutral";
}

function getInitials(name: string | null) {
  if (!name) return "NA";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getDueDateValue(label: string) {
  if (label === "Today") return "Aug 9, 2026";
  if (label.startsWith("Overdue")) return "Past due";
  return label;
}

function buildWorkflow(task: TaskDirectoryRecord): WorkflowStep[] {
  const currentKey =
    task.status === TaskStatus.REVISION ? "revision" : task.status.toLowerCase();

  const steps: Array<{ key: string; label: string }> = [
    { key: "todo", label: "To do" },
    { key: "in_progress", label: "In progress" },
    { key: "in_review", label: "In review" },
    { key: "done", label: task.status === TaskStatus.REVISION ? "Revision" : "Done" },
  ];

  const weights: Record<string, number> = {
    todo: 0,
    in_progress: 1,
    in_review: 2,
    revision: 3,
    done: 3,
  };

  return steps.map((step, index) => {
    const currentWeight = weights[currentKey];

    return {
      key: step.key,
      label: step.label,
      state:
        index < currentWeight
          ? "completed"
          : index === currentWeight
            ? "current"
            : "upcoming",
      value:
        step.key === "done" && task.status === TaskStatus.REVISION
          ? String(task.revisionCount || 1)
          : undefined,
    } satisfies WorkflowStep;
  });
}

function buildComments(task: TaskDirectoryRecord, projectManager: string): TaskDetailComment[] {
  const base: TaskDetailComment[] = [
    {
      id: `${task.id}-comment-1`,
      senderId: `${task.id}-pm`,
      author: projectManager,
      role: "PM",
      audience: "Team",
      postedAt: "Aug 7, 2026 · 10:15",
      message: "Focus this task on the current delivery window and confirm the final handoff time.",
      tone: "active",
    },
  ];

  if (task.assigneeName) {
    base.push({
      id: `${task.id}-comment-2`,
      senderId: `${task.id}-assignee`,
      author: task.assigneeName,
      role: "Assignee",
      audience: "Team",
      postedAt: "Aug 8, 2026 · 13:40",
      message:
        task.status === TaskStatus.IN_REVIEW
          ? "Delivered for review. Waiting for PM approval before publishing."
          : task.status === TaskStatus.REVISION
            ? "Picked up the revision notes and reworking the final output now."
            : "Current execution is moving with no dependency from the client side.",
      tone: getTaskStatusTone(task.status),
    });
  }

  if (task.signalTone === "destructive" || task.signalTone === "warning") {
    base.push({
      id: `${task.id}-comment-3`,
      senderId: `${task.id}-admin`,
      author: "Admin delivery desk",
      role: "Admin",
      audience: "Internal",
      postedAt: "Aug 9, 2026 · 09:05",
      message: `Escalation noted: ${task.signalSummary}`,
      tone: task.signalTone,
    });
  }

  return base;
}

function buildFiles(task: TaskDirectoryRecord): TaskDetailFile[] {
  return [
    {
      id: `${task.id}-file-brief`,
      name: "Task brief.pdf",
      purpose: "Brief",
      uploadedAt: "Aug 5, 2026",
      uploadedBy: "PM office",
      mime: "PDF",
    },
    {
      id: `${task.id}-file-output`,
      name:
        task.department === TaskDepartment.MARKETING
          ? "Audience segment plan.xlsx"
          : "Latest working file.zip",
      purpose: task.status === TaskStatus.IN_REVIEW ? "Submission" : "Working file",
      uploadedAt: "Aug 8, 2026",
      uploadedBy: task.assigneeName ?? "Unassigned",
      mime: task.department === TaskDepartment.MARKETING ? "XLSX" : "ZIP",
    },
  ];
}

function buildHistory(task: TaskDirectoryRecord, projectManager: string): TaskDetailHistory[] {
  const history: TaskDetailHistory[] = [
    {
      id: `${task.id}-history-created`,
      date: "Aug 5, 2026",
      title: "Task created",
      summary: `Task entered the ${task.periodLabel} queue under ${formatTaskDepartment(task.department)}.`,
      actor: projectManager,
      tone: "success",
      completed: true,
    },
  ];

  if (task.assigneeName) {
    history.push({
      id: `${task.id}-history-assigned`,
      date: "Aug 6, 2026",
      title: "Task assigned",
      summary: `${task.assigneeName} became the execution owner for this task.`,
      actor: projectManager,
      tone: "active",
      completed: true,
    });
  }

  if (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.IN_REVIEW || task.status === TaskStatus.DONE) {
    history.push({
      id: `${task.id}-history-started`,
      date: "Aug 7, 2026",
      title: "Execution started",
      summary: "The assignee moved the task from queue into active execution.",
      actor: task.assigneeName ?? "Assignee",
      tone: "active",
      completed: true,
    });
  }

  if (task.status === TaskStatus.IN_REVIEW || task.status === TaskStatus.DONE || task.status === TaskStatus.REVISION) {
    history.push({
      id: `${task.id}-history-review`,
      date: "Aug 8, 2026",
      title: "Submitted for review",
      summary:
        task.status === TaskStatus.REVISION
          ? "The submission was reviewed and sent back with revision notes."
          : "The current output is waiting for PM review.",
      actor: task.assigneeName ?? "Assignee",
      tone: task.status === TaskStatus.REVISION ? "warning" : "warning",
      completed: task.status !== TaskStatus.REVISION,
    });
  }

  if (task.status === TaskStatus.DONE) {
    history.push({
      id: `${task.id}-history-approved`,
      date: "Aug 9, 2026",
      title: "Approved",
      summary: "PM approved the final output and closed the workflow.",
      actor: projectManager,
      tone: "success",
      completed: true,
    });
  }

  return history;
}

function buildMarketing(task: TaskDirectoryRecord): TaskMarketingExtension | undefined {
  if (task.department !== TaskDepartment.MARKETING) return undefined;

  const status =
    task.status === TaskStatus.IN_REVIEW
      ? MarketingStrategyStatus.SENT
      : task.status === TaskStatus.DONE
        ? MarketingStrategyStatus.APPROVED
        : task.status === TaskStatus.REVISION
          ? MarketingStrategyStatus.REVISION_REQUESTED
          : MarketingStrategyStatus.DRAFT;

  return {
    strategyId: `strategy-${task.id}`,
    status,
    statusLabel: marketingStatusLabels[status],
    statusTone: getMarketingStatusTone(status),
    fileName: "Audience strategy.pdf",
    updatedAt: "Aug 8, 2026",
    sentAt: status === MarketingStrategyStatus.SENT || status === MarketingStrategyStatus.APPROVED ? "Aug 8, 2026" : undefined,
    approvedAt: status === MarketingStrategyStatus.APPROVED ? "Aug 9, 2026" : undefined,
    revisionNote:
      status === MarketingStrategyStatus.REVISION_REQUESTED
        ? "Segment assumptions need stronger justification before campaign creation."
        : undefined,
    campaignReadiness:
      status === MarketingStrategyStatus.APPROVED
        ? "Approved strategy. Campaign creation can start."
        : status === MarketingStrategyStatus.SENT
          ? "Waiting for client decision before campaigns can start."
          : "Campaign creation is blocked until strategy approval.",
    campaignReadinessTone:
      status === MarketingStrategyStatus.APPROVED ? "success" : "warning",
    campaigns: [
      {
        id: `${task.id}-campaign-meta-1`,
        name: "Ramadan awareness burst",
        platform: "Meta Ads",
        owner: task.assigneeName ?? "Marketing owner",
        status: status === MarketingStrategyStatus.APPROVED ? "Live" : "Ready",
        statusTone: status === MarketingStrategyStatus.APPROVED ? "success" : "active",
        budget: "$18,000",
        spend: "$9,420",
        wonValue: "$46,000",
        performanceLabel: "3.8x ROAS",
        launchedAt: "Aug 6, 2026",
        snapshot: [
          { label: "Spend", value: "$9,420", helper: "Booked so far" },
          { label: "Leads", value: "184", helper: "Qualified leads" },
          { label: "CPL", value: "$51", helper: "Cost per lead" },
          { label: "Won value", value: "$46,000", helper: "Closed revenue" },
        ],
        rows: [
          { label: "CTR", value: "3.9%" },
          { label: "Conversions", value: "27" },
          { label: "Frequency", value: "2.7" },
          { label: "Audience", value: "Clinic decision makers" },
          { label: "Primary goal", value: "Lead generation" },
          { label: "Landing page", value: "Audience offer page" },
        ],
      },
      {
        id: `${task.id}-campaign-google-2`,
        name: "Search demand capture",
        platform: "Google Ads",
        owner: task.assigneeName ?? "Marketing owner",
        status: status === MarketingStrategyStatus.APPROVED ? "Optimizing" : "Drafted",
        statusTone: status === MarketingStrategyStatus.APPROVED ? "warning" : "neutral",
        budget: "$10,000",
        spend: "$4,180",
        wonValue: "$19,500",
        performanceLabel: "2.9x ROAS",
        launchedAt: "Aug 7, 2026",
        snapshot: [
          { label: "Spend", value: "$4,180", helper: "Booked so far" },
          { label: "Clicks", value: "1,260", helper: "Traffic volume" },
          { label: "Conv. rate", value: "6.1%", helper: "Lead conversion" },
          { label: "Won value", value: "$19,500", helper: "Closed revenue" },
        ],
        rows: [
          { label: "CPC", value: "$3.31" },
          { label: "Leads", value: "77" },
          { label: "Top keyword", value: "clinic growth partner" },
          { label: "Primary goal", value: "Demand capture" },
          { label: "Bid strategy", value: "Maximize conversions" },
          { label: "Landing page", value: "Consultation request page" },
        ],
      },
    ],
  };
}

function buildTaskDetail(task: TaskDirectoryRecord): TaskDetailRecord {
  const project = projectDirectoryRecords.find((item) => item.id === task.projectId);
  const client = clientDirectoryRecords.find((item) => item.companyName === task.clientName) ?? null;
  const projectManager = project?.projectManager ?? "Mona Saleh";

  return {
    id: task.id,
    title: task.title,
    description:
      task.department === TaskDepartment.MARKETING
        ? "Marketing execution task tied to strategy approval, campaign readiness, and PM follow-up."
        : "Operational task tracked inside the project workflow with PM review and internal collaboration.",
    status: task.status,
    statusLabel: formatTaskStatus(task.status),
    statusTone: getTaskStatusTone(task.status),
    priority: task.priority,
    priorityLabel: formatTaskPriority(task.priority),
    priorityTone: getTaskPriorityTone(task.priority),
    department: task.department,
    departmentLabel: formatTaskDepartment(task.department),
    projectId: task.projectId,
    projectName: task.projectName,
    projectStatus: task.projectStatus,
    projectStatusLabel: formatProjectStatus(task.projectStatus),
    projectStatusTone: getProjectStatusTone(task.projectStatus),
    clientId: client?.id ?? null,
    clientName: task.clientName,
    clientStageLabel: client ? formatClientStage(client.stage) : null,
    clientStageTone: client?.stageTone ?? "neutral",
    assigneeName: task.assigneeName,
    assigneeInitials: getInitials(task.assigneeName),
    projectManager,
    dueDateLabel: task.dueDateLabel,
    dueDateValue: getDueDateValue(task.dueDateLabel),
    periodLabel: task.periodLabel,
    isClientVisible: task.isClientVisible,
    revisionCount: task.revisionCount,
    isArchived: task.isArchived,
    signalLabel: task.signalLabel,
    signalSummary: task.signalSummary,
    signalTone: task.signalTone,
    workflow: buildWorkflow(task),
    metrics: [
      {
        label: "Workflow state",
        value: formatTaskStatus(task.status),
        description: "Current task state in the delivery workflow.",
        trend: { label: task.signalLabel, tone: task.signalTone },
      },
      {
        label: "Priority",
        value: formatTaskPriority(task.priority),
        description: "Priority set for this execution item.",
        trend: { label: task.department === TaskDepartment.MARKETING ? "Strategy linked" : "Execution item", tone: "neutral" },
      },
      {
        label: "Revisions",
        value: String(task.revisionCount),
        description: "How many review loops this task has already taken.",
        trend:
          task.revisionCount > 0
            ? { label: "Revision history", tone: "warning" }
            : undefined,
      },
      {
        label: "Visibility",
        value: task.isClientVisible ? "Client visible" : "Internal only",
        description: "Whether the client sees this task directly.",
      },
    ],
    clientSummary: client
      ? [
          {
            label: "Relationship",
            value: formatClientStage(client.stage),
            helper: "Current client state",
          },
          {
            label: "Active projects",
            value: String(client.activeProjects),
            helper: "Projects live right now",
          },
          {
            label: "Total spend",
            value: formatMoney(client.totalSpend),
            helper: "Closed revenue",
          },
          {
            label: "Owner",
            value: client.owner,
            helper: "Account owner",
          },
        ]
      : [
          {
            label: "Relationship",
            value: "Unavailable",
            helper: "No client fixture linked",
          },
        ],
    comments: buildComments(task, projectManager),
    files: buildFiles(task),
    history: buildHistory(task, projectManager),
    marketing: buildMarketing(task),
  };
}

const taskDetailRecords = taskDirectoryRecords.map(buildTaskDetail);

export function getTaskDetailById(taskId: string) {
  return taskDetailRecords.find((task) => task.id === taskId) ?? null;
}
