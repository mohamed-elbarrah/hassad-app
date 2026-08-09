import {
  ProjectPeriodStatus,
  ProjectStatus,
  TaskDepartment,
  TaskPriority,
} from "@hassad/shared";

import type { StatusTone } from "@/components/patterns/status-badge";

export type ProjectDirectoryStatusFilter =
  | "all"
  | "active"
  | "attention"
  | "completed";

export type ProjectDirectoryModelFilter = "all-models" | "recurring" | "one-off";

export type ProjectDirectoryTimelineFilter =
  | "all-timelines"
  | "ending-soon"
  | "overdue"
  | "archived";

export type ProjectDirectorySort =
  | "highest-value"
  | "ending-soon"
  | "newest";

export type ProjectDirectoryRecord = {
  id: string;
  name: string;
  clientName: string;
  projectManager: string;
  status: ProjectStatus;
  statusTone: StatusTone;
  archived: boolean;
  archivedTone: StatusTone;
  model: "recurring" | "one-off";
  priority: TaskPriority;
  completionPercentage: number;
  teamSize: number;
  assignedDepartments: TaskDepartment[];
  startDate: string;
  endDate: string;
  daysToEnd: number;
  totalValue: number;
  remainingValue: number;
  overdueTasks: number;
  openRevisions: number;
  deliverablesWaitingReview: number;
  healthLabel: string;
  healthSummary: string;
  healthTone: StatusTone;
  currentPeriodLabel: string;
  currentPeriodStatusLabel: string;
  currentPeriodStatusTone: StatusTone;
  periodsCompleted: number;
  totalPeriods: number;
};

const projectStatusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "Planning",
  [ProjectStatus.PENDING_ACTIVATION]: "Pending activation",
  [ProjectStatus.ACTIVE]: "Active",
  [ProjectStatus.ON_HOLD]: "On hold",
  [ProjectStatus.AWAITING_REVIEW]: "Awaiting review",
  [ProjectStatus.NEEDS_REVISION]: "Needs revision",
  [ProjectStatus.COMPLETED]: "Completed",
  [ProjectStatus.CANCELLED]: "Cancelled",
};

const periodStatusLabels: Record<ProjectPeriodStatus, string> = {
  [ProjectPeriodStatus.UPCOMING]: "Upcoming",
  [ProjectPeriodStatus.ACTIVE]: "Active",
  [ProjectPeriodStatus.CLOSED]: "Closed",
  [ProjectPeriodStatus.SUSPENDED]: "Suspended",
};

const departmentLabels: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "Design",
  [TaskDepartment.CONTENT]: "Content",
  [TaskDepartment.DEVELOPMENT]: "Development",
  [TaskDepartment.MARKETING]: "Marketing",
  [TaskDepartment.PRODUCTION]: "Production",
};

export const projectDirectoryRecords: ProjectDirectoryRecord[] = [
  {
    id: "project-greenline-retainer",
    name: "Greenline growth retainer",
    clientName: "Greenline",
    projectManager: "Mona Saleh",
    status: ProjectStatus.ACTIVE,
    statusTone: "active",
    archived: false,
    archivedTone: "neutral",
    model: "recurring",
    priority: TaskPriority.HIGH,
    completionPercentage: 72,
    teamSize: 7,
    assignedDepartments: [
      TaskDepartment.DESIGN,
      TaskDepartment.CONTENT,
      TaskDepartment.MARKETING,
    ],
    startDate: "Jun 1, 2026",
    endDate: "Nov 30, 2026",
    daysToEnd: 114,
    totalValue: 186000,
    remainingValue: 64000,
    overdueTasks: 3,
    openRevisions: 1,
    deliverablesWaitingReview: 2,
    healthLabel: "Watch",
    healthSummary: "3 overdue tasks · 1 open revision",
    healthTone: "warning",
    currentPeriodLabel: "Period 3 of 6",
    currentPeriodStatusLabel: periodStatusLabels[ProjectPeriodStatus.ACTIVE],
    currentPeriodStatusTone: "active",
    periodsCompleted: 2,
    totalPeriods: 6,
  },
  {
    id: "project-al-noor-launch",
    name: "Al Noor launch campaign",
    clientName: "Al Noor",
    projectManager: "Mona Saleh",
    status: ProjectStatus.ACTIVE,
    statusTone: "active",
    archived: false,
    archivedTone: "neutral",
    model: "one-off",
    priority: TaskPriority.HIGH,
    completionPercentage: 58,
    teamSize: 5,
    assignedDepartments: [
      TaskDepartment.DESIGN,
      TaskDepartment.CONTENT,
      TaskDepartment.PRODUCTION,
    ],
    startDate: "Jul 14, 2026",
    endDate: "Aug 25, 2026",
    daysToEnd: 17,
    totalValue: 28000,
    remainingValue: 12000,
    overdueTasks: 2,
    openRevisions: 0,
    deliverablesWaitingReview: 1,
    healthLabel: "Watch",
    healthSummary: "2 overdue tasks · 1 deliverable waiting review",
    healthTone: "attention",
    currentPeriodLabel: "One-off delivery",
    currentPeriodStatusLabel: "No monthly periods",
    currentPeriodStatusTone: "neutral",
    periodsCompleted: 0,
    totalPeriods: 0,
  },
  {
    id: "project-pulse-crm-rollout",
    name: "Pulse CRM rollout",
    clientName: "Pulse Health",
    projectManager: "Fadi Kareem",
    status: ProjectStatus.PENDING_ACTIVATION,
    statusTone: "attention",
    archived: false,
    archivedTone: "neutral",
    model: "recurring",
    priority: TaskPriority.NORMAL,
    completionPercentage: 8,
    teamSize: 4,
    assignedDepartments: [TaskDepartment.DEVELOPMENT, TaskDepartment.MARKETING],
    startDate: "Aug 6, 2026",
    endDate: "Nov 30, 2026",
    daysToEnd: 114,
    totalValue: 99000,
    remainingValue: 99000,
    overdueTasks: 0,
    openRevisions: 0,
    deliverablesWaitingReview: 0,
    healthLabel: "Blocked",
    healthSummary: "Waiting first payment",
    healthTone: "attention",
    currentPeriodLabel: "Period 1 of 4",
    currentPeriodStatusLabel: periodStatusLabels[ProjectPeriodStatus.UPCOMING],
    currentPeriodStatusTone: "attention",
    periodsCompleted: 0,
    totalPeriods: 4,
  },
  {
    id: "project-riyadh-clinics-growth",
    name: "Riyadh Clinics growth engine",
    clientName: "Riyadh Clinics",
    projectManager: "Fadi Kareem",
    status: ProjectStatus.ON_HOLD,
    statusTone: "warning",
    archived: false,
    archivedTone: "neutral",
    model: "recurring",
    priority: TaskPriority.URGENT,
    completionPercentage: 46,
    teamSize: 6,
    assignedDepartments: [
      TaskDepartment.CONTENT,
      TaskDepartment.DEVELOPMENT,
      TaskDepartment.MARKETING,
    ],
    startDate: "May 10, 2026",
    endDate: "Oct 9, 2026",
    daysToEnd: 62,
    totalValue: 142000,
    remainingValue: 76000,
    overdueTasks: 4,
    openRevisions: 2,
    deliverablesWaitingReview: 3,
    healthLabel: "Blocked",
    healthSummary: "Suspended period · 4 overdue tasks",
    healthTone: "destructive",
    currentPeriodLabel: "Period 4 of 5",
    currentPeriodStatusLabel: periodStatusLabels[ProjectPeriodStatus.SUSPENDED],
    currentPeriodStatusTone: "destructive",
    periodsCompleted: 3,
    totalPeriods: 5,
  },
  {
    id: "project-safa-employer-brand",
    name: "Safa employer brand system",
    clientName: "Safa Logistics",
    projectManager: "Mona Saleh",
    status: ProjectStatus.AWAITING_REVIEW,
    statusTone: "warning",
    archived: false,
    archivedTone: "neutral",
    model: "recurring",
    priority: TaskPriority.HIGH,
    completionPercentage: 81,
    teamSize: 5,
    assignedDepartments: [
      TaskDepartment.DESIGN,
      TaskDepartment.CONTENT,
      TaskDepartment.PRODUCTION,
    ],
    startDate: "Jul 1, 2026",
    endDate: "Sep 30, 2026",
    daysToEnd: 53,
    totalValue: 61000,
    remainingValue: 18000,
    overdueTasks: 1,
    openRevisions: 2,
    deliverablesWaitingReview: 3,
    healthLabel: "Review",
    healthSummary: "3 client reviews open",
    healthTone: "warning",
    currentPeriodLabel: "Period 2 of 3",
    currentPeriodStatusLabel: periodStatusLabels[ProjectPeriodStatus.ACTIVE],
    currentPeriodStatusTone: "active",
    periodsCompleted: 1,
    totalPeriods: 3,
  },
  {
    id: "project-enterprise-foods-rebrand",
    name: "Enterprise Foods rebrand",
    clientName: "Enterprise Foods",
    projectManager: "Mona Saleh",
    status: ProjectStatus.PLANNING,
    statusTone: "neutral",
    archived: false,
    archivedTone: "neutral",
    model: "one-off",
    priority: TaskPriority.NORMAL,
    completionPercentage: 16,
    teamSize: 3,
    assignedDepartments: [TaskDepartment.DESIGN, TaskDepartment.CONTENT],
    startDate: "Aug 4, 2026",
    endDate: "Oct 15, 2026",
    daysToEnd: 68,
    totalValue: 54000,
    remainingValue: 54000,
    overdueTasks: 0,
    openRevisions: 0,
    deliverablesWaitingReview: 0,
    healthLabel: "Healthy",
    healthSummary: "Discovery on track",
    healthTone: "success",
    currentPeriodLabel: "One-off delivery",
    currentPeriodStatusLabel: "No monthly periods",
    currentPeriodStatusTone: "neutral",
    periodsCompleted: 0,
    totalPeriods: 0,
  },
  {
    id: "project-northstar-seasonal",
    name: "Northstar seasonal content pack",
    clientName: "Northstar",
    projectManager: "Fadi Kareem",
    status: ProjectStatus.COMPLETED,
    statusTone: "success",
    archived: true,
    archivedTone: "neutral",
    model: "one-off",
    priority: TaskPriority.NORMAL,
    completionPercentage: 100,
    teamSize: 4,
    assignedDepartments: [
      TaskDepartment.DESIGN,
      TaskDepartment.CONTENT,
      TaskDepartment.PRODUCTION,
    ],
    startDate: "May 3, 2026",
    endDate: "Jul 18, 2026",
    daysToEnd: -21,
    totalValue: 24000,
    remainingValue: 0,
    overdueTasks: 0,
    openRevisions: 0,
    deliverablesWaitingReview: 0,
    healthLabel: "Closed",
    healthSummary: "Closed with final approval",
    healthTone: "success",
    currentPeriodLabel: "One-off delivery",
    currentPeriodStatusLabel: "Archived after delivery",
    currentPeriodStatusTone: "neutral",
    periodsCompleted: 0,
    totalPeriods: 0,
  },
  {
    id: "project-oasis-loyalty-activation",
    name: "Oasis loyalty activation",
    clientName: "Oasis Retail",
    projectManager: "Fadi Kareem",
    status: ProjectStatus.NEEDS_REVISION,
    statusTone: "attention",
    archived: false,
    archivedTone: "neutral",
    model: "one-off",
    priority: TaskPriority.HIGH,
    completionPercentage: 63,
    teamSize: 5,
    assignedDepartments: [
      TaskDepartment.DESIGN,
      TaskDepartment.CONTENT,
      TaskDepartment.PRODUCTION,
    ],
    startDate: "Jun 28, 2026",
    endDate: "Aug 14, 2026",
    daysToEnd: 6,
    totalValue: 32000,
    remainingValue: 10000,
    overdueTasks: 2,
    openRevisions: 3,
    deliverablesWaitingReview: 0,
    healthLabel: "Blocked",
    healthSummary: "3 revisions open · deadline in 6 days",
    healthTone: "destructive",
    currentPeriodLabel: "One-off delivery",
    currentPeriodStatusLabel: "No monthly periods",
    currentPeriodStatusTone: "neutral",
    periodsCompleted: 0,
    totalPeriods: 0,
  },
];

export function formatProjectStatus(status: ProjectStatus) {
  return projectStatusLabels[status];
}

export function formatProjectDepartments(departments: TaskDepartment[]) {
  return departments.map((department) => departmentLabels[department]).join(", ");
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeline(daysToEnd: number, endDate: string) {
  if (daysToEnd < 0) {
    return `Ended ${Math.abs(daysToEnd)}d ago`;
  }

  if (daysToEnd === 0) {
    return "Ends today";
  }

  return `${daysToEnd}d left · ${endDate}`;
}

export function getFilteredProjects(
  search: string,
  statusFilter: ProjectDirectoryStatusFilter,
  modelFilter: ProjectDirectoryModelFilter,
  timelineFilter: ProjectDirectoryTimelineFilter,
  sort: ProjectDirectorySort
) {
  const query = search.trim().toLowerCase();

  return projectDirectoryRecords
    .filter((row) => {
      if (!query) return true;

      return [
        row.name,
        row.clientName,
        row.projectManager,
        formatProjectDepartments(row.assignedDepartments),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((row) => {
      if (statusFilter === "active") {
        return (
          row.status === ProjectStatus.ACTIVE ||
          row.status === ProjectStatus.AWAITING_REVIEW
        );
      }

      if (statusFilter === "attention") {
        return (
          row.healthTone === "attention" ||
          row.healthTone === "warning" ||
          row.healthTone === "destructive"
        );
      }

      if (statusFilter === "completed") {
        return row.status === ProjectStatus.COMPLETED;
      }

      return true;
    })
    .filter((row) => {
      if (modelFilter === "recurring") return row.model === "recurring";
      if (modelFilter === "one-off") return row.model === "one-off";
      return true;
    })
    .filter((row) => {
      if (timelineFilter === "ending-soon") {
        return row.daysToEnd >= 0 && row.daysToEnd <= 21;
      }

      if (timelineFilter === "overdue") {
        return row.daysToEnd < 0 || row.overdueTasks > 0;
      }

      if (timelineFilter === "archived") {
        return row.archived;
      }

      return true;
    })
    .toSorted((left, right) => {
      if (sort === "ending-soon") {
        return left.daysToEnd - right.daysToEnd;
      }

      if (sort === "newest") {
        return new Date(right.startDate).getTime() - new Date(left.startDate).getTime();
      }

      return right.totalValue - left.totalValue;
    });
}
