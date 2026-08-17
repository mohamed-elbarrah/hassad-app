import {
  ProjectStatus,
  TaskDepartment,
  TaskPriority,
  TaskStatus,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";

export type TaskDirectoryQueueFilter =
  | "all"
  | "attention"
  | "in-review"
  | "unassigned";

export type TaskDirectoryDueFilter =
  | "all-dates"
  | "overdue"
  | "today"
  | "next-7-days";

export type TaskDirectoryVisibilityFilter =
  | "all-visibility"
  | "client-visible"
  | "internal-only";

export type TaskDirectoryRecord = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  clientName: string;
  projectStatus: ProjectStatus;
  department: TaskDepartment;
  assigneeName: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDateLabel: string;
  dueOffsetDays: number;
  periodLabel: string;
  isClientVisible: boolean;
  isArchived: boolean;
  revisionCount: number;
  signalLabel: string;
  signalSummary: string;
  signalTone: StatusTone;
};

const departmentLabels: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "Design",
  [TaskDepartment.CONTENT]: "Content",
  [TaskDepartment.DEVELOPMENT]: "Development",
  [TaskDepartment.MARKETING]: "Marketing",
  [TaskDepartment.PRODUCTION]: "Production",
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To do",
  [TaskStatus.IN_PROGRESS]: "In progress",
  [TaskStatus.IN_REVIEW]: "In review",
  [TaskStatus.DONE]: "Done",
  [TaskStatus.REVISION]: "Revision",
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.NORMAL]: "Normal",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.URGENT]: "Urgent",
};

export const taskDirectoryRecords: TaskDirectoryRecord[] = [
  {
    id: "task-greenline-copy-qa",
    title: "Approve August campaign copy QA",
    projectId: "project-greenline-retainer",
    projectName: "Greenline growth retainer",
    clientName: "Greenline",
    projectStatus: ProjectStatus.ACTIVE,
    department: TaskDepartment.CONTENT,
    assigneeName: null,
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDateLabel: "Today",
    dueOffsetDays: 0,
    periodLabel: "P3/6",
    isClientVisible: false,
    isArchived: false,
    revisionCount: 0,
    signalLabel: "Unassigned",
    signalSummary: "Needs owner before today's delivery review",
    signalTone: "destructive",
  },
  {
    id: "task-greenline-storyboards",
    title: "Submit motion storyboards for review",
    projectId: "project-greenline-retainer",
    projectName: "Greenline growth retainer",
    clientName: "Greenline",
    projectStatus: ProjectStatus.ACTIVE,
    department: TaskDepartment.PRODUCTION,
    assigneeName: "Alaa Samir",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.HIGH,
    dueDateLabel: "Aug 9, 2026",
    dueOffsetDays: 1,
    periodLabel: "P3/6",
    isClientVisible: true,
    isArchived: false,
    revisionCount: 1,
    signalLabel: "Review",
    signalSummary: "Waiting PM decision",
    signalTone: "warning",
  },
  {
    id: "task-al-noor-packaging-copy",
    title: "Revise packaging launch copy",
    projectId: "project-al-noor-launch",
    projectName: "Al Noor launch campaign",
    clientName: "Al Noor",
    projectStatus: ProjectStatus.ACTIVE,
    department: TaskDepartment.CONTENT,
    assigneeName: "Sara Adel",
    status: TaskStatus.REVISION,
    priority: TaskPriority.URGENT,
    dueDateLabel: "Overdue by 2d",
    dueOffsetDays: -2,
    periodLabel: "One-off",
    isClientVisible: true,
    isArchived: false,
    revisionCount: 2,
    signalLabel: "Overdue",
    signalSummary: "Revision loop is blocking launch assets",
    signalTone: "destructive",
  },
  {
    id: "task-pulse-kickoff-board",
    title: "Set up CRM implementation board",
    projectId: "project-pulse-crm-rollout",
    projectName: "Pulse CRM rollout",
    clientName: "Pulse Health",
    projectStatus: ProjectStatus.PENDING_ACTIVATION,
    department: TaskDepartment.DEVELOPMENT,
    assigneeName: "Hatem Salah",
    status: TaskStatus.TODO,
    priority: TaskPriority.NORMAL,
    dueDateLabel: "Aug 12, 2026",
    dueOffsetDays: 4,
    periodLabel: "P1/4",
    isClientVisible: false,
    isArchived: false,
    revisionCount: 0,
    signalLabel: "Blocked",
    signalSummary: "Project not activated yet",
    signalTone: "attention",
  },
  {
    id: "task-riyadh-audience-sync",
    title: "Sync clinic audience segments",
    projectId: "project-riyadh-clinics-growth",
    projectName: "Riyadh Clinics growth engine",
    clientName: "Riyadh Clinics",
    projectStatus: ProjectStatus.ON_HOLD,
    department: TaskDepartment.MARKETING,
    assigneeName: "Nour Hassan",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.URGENT,
    dueDateLabel: "Overdue by 5d",
    dueOffsetDays: -5,
    periodLabel: "P4/5",
    isClientVisible: false,
    isArchived: false,
    revisionCount: 0,
    signalLabel: "Blocked",
    signalSummary: "Work is active while project is on hold",
    signalTone: "destructive",
  },
  {
    id: "task-safa-evp-layouts",
    title: "Finalize EVP page layouts",
    projectId: "project-safa-employer-brand",
    projectName: "Safa employer brand system",
    clientName: "Safa Logistics",
    projectStatus: ProjectStatus.AWAITING_REVIEW,
    department: TaskDepartment.DESIGN,
    assigneeName: "Lina Farouk",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.HIGH,
    dueDateLabel: "Aug 10, 2026",
    dueOffsetDays: 2,
    periodLabel: "P2/3",
    isClientVisible: true,
    isArchived: false,
    revisionCount: 0,
    signalLabel: "Review",
    signalSummary: "Client-facing asset is awaiting PM review",
    signalTone: "warning",
  },
  {
    id: "task-enterprise-discovery-notes",
    title: "Document brand discovery notes",
    projectId: "project-enterprise-foods-rebrand",
    projectName: "Enterprise Foods rebrand",
    clientName: "Enterprise Foods",
    projectStatus: ProjectStatus.PLANNING,
    department: TaskDepartment.CONTENT,
    assigneeName: "Mariam Tarek",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.NORMAL,
    dueDateLabel: "Aug 14, 2026",
    dueOffsetDays: 6,
    periodLabel: "One-off",
    isClientVisible: false,
    isArchived: false,
    revisionCount: 0,
    signalLabel: "On track",
    signalSummary: "Planning work is moving normally",
    signalTone: "success",
  },
  {
    id: "task-oasis-store-renders",
    title: "Update store activation renders",
    projectId: "project-oasis-loyalty-activation",
    projectName: "Oasis loyalty activation",
    clientName: "Oasis Retail",
    projectStatus: ProjectStatus.NEEDS_REVISION,
    department: TaskDepartment.DESIGN,
    assigneeName: "Karim Fawzi",
    status: TaskStatus.REVISION,
    priority: TaskPriority.HIGH,
    dueDateLabel: "Today",
    dueOffsetDays: 0,
    periodLabel: "One-off",
    isClientVisible: true,
    isArchived: false,
    revisionCount: 3,
    signalLabel: "Revision",
    signalSummary: "3 revision rounds on a same-day deadline",
    signalTone: "destructive",
  },
  {
    id: "task-northstar-final-export",
    title: "Archive final export package",
    projectId: "project-northstar-seasonal",
    projectName: "Northstar seasonal content pack",
    clientName: "Northstar",
    projectStatus: ProjectStatus.COMPLETED,
    department: TaskDepartment.PRODUCTION,
    assigneeName: "Alaa Samir",
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    dueDateLabel: "Jul 18, 2026",
    dueOffsetDays: -21,
    periodLabel: "One-off",
    isClientVisible: false,
    isArchived: true,
    revisionCount: 0,
    signalLabel: "Archived",
    signalSummary: "Closed task kept for delivery history",
    signalTone: "neutral",
  },
];

export function formatTaskDepartment(value: TaskDepartment) {
  return departmentLabels[value];
}

export function formatTaskStatus(value: TaskStatus) {
  return statusLabels[value];
}

export function formatTaskPriority(value: TaskPriority) {
  return priorityLabels[value];
}

export function getTaskStatusTone(status: TaskStatus): StatusTone {
  if (status === TaskStatus.DONE) return "success";
  if (status === TaskStatus.IN_REVIEW) return "warning";
  if (status === TaskStatus.REVISION) return "attention";
  if (status === TaskStatus.IN_PROGRESS) return "active";
  return "neutral";
}

export function getTaskPriorityTone(priority: TaskPriority): StatusTone {
  if (priority === TaskPriority.URGENT) return "destructive";
  if (priority === TaskPriority.HIGH) return "warning";
  if (priority === TaskPriority.NORMAL) return "active";
  return "neutral";
}

export function getAllowedTeamTaskStatuses(status: TaskStatus): TaskStatus[] {
  switch (status) {
    case TaskStatus.TODO:
    case TaskStatus.REVISION:
      return [TaskStatus.IN_PROGRESS];
    case TaskStatus.IN_PROGRESS:
      return [TaskStatus.IN_REVIEW];
    case TaskStatus.IN_REVIEW:
      return [TaskStatus.REVISION];
    case TaskStatus.DONE:
      return [];
    default:
      return [];
  }
}

export function getFilteredTasks(params: {
  search: string;
  queue: TaskDirectoryQueueFilter;
  department: TaskDepartment | "all-departments";
  status: TaskStatus | "all-statuses";
  priority: TaskPriority | "all-priorities";
  due: TaskDirectoryDueFilter;
  visibility: TaskDirectoryVisibilityFilter;
}) {
  const query = params.search.trim().toLowerCase();

  return taskDirectoryRecords
    .filter((row) => {
      if (!query) return true;

      return [
        row.title,
        row.projectName,
        row.clientName,
        row.assigneeName ?? "unassigned",
        formatTaskDepartment(row.department),
        row.periodLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((row) => {
      if (params.queue === "attention") {
        return (
          row.signalTone === "destructive" ||
          row.signalTone === "attention" ||
          row.signalTone === "warning"
        );
      }

      if (params.queue === "in-review") {
        return row.status === TaskStatus.IN_REVIEW;
      }

      if (params.queue === "unassigned") {
        return !row.assigneeName;
      }

      return true;
    })
    .filter((row) => {
      if (params.department === "all-departments") return true;
      return row.department === params.department;
    })
    .filter((row) => {
      if (params.status === "all-statuses") return true;
      return row.status === params.status;
    })
    .filter((row) => {
      if (params.priority === "all-priorities") return true;
      return row.priority === params.priority;
    })
    .filter((row) => {
      if (params.due === "overdue") return row.dueOffsetDays < 0;
      if (params.due === "today") return row.dueOffsetDays === 0;
      if (params.due === "next-7-days") {
        return row.dueOffsetDays >= 0 && row.dueOffsetDays <= 7;
      }
      return true;
    })
    .filter((row) => {
      if (params.visibility === "client-visible") return row.isClientVisible;
      if (params.visibility === "internal-only") return !row.isClientVisible;
      return true;
    })
    .toSorted((left, right) => {
      if (left.dueOffsetDays < 0 && right.dueOffsetDays >= 0) return -1;
      if (left.dueOffsetDays >= 0 && right.dueOffsetDays < 0) return 1;

      const priorityWeight = {
        [TaskPriority.URGENT]: 4,
        [TaskPriority.HIGH]: 3,
        [TaskPriority.NORMAL]: 2,
        [TaskPriority.LOW]: 1,
      };

      const leftPriority = priorityWeight[left.priority];
      const rightPriority = priorityWeight[right.priority];

      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }

      if (left.dueOffsetDays !== right.dueOffsetDays) {
        return left.dueOffsetDays - right.dueOffsetDays;
      }

      return left.title.localeCompare(right.title);
    });
}
