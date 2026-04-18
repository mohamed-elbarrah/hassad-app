export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskDepartment {
  DESIGN = "DESIGN",
  MARKETING = "MARKETING",
  DEVELOPMENT = "DEVELOPMENT",
  CONTENT = "CONTENT",
  MANAGEMENT = "MANAGEMENT",
}

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENTED"
  | "PROJECT_STATUS_CHANGED"
  | "TASK_UPDATED"
  | "TASK_COMMENT_ADDED"
  | "TASK_FILE_UPLOADED"
  | "TASK_OVERDUE"
  | "TASK_DELAY_WARNING"
  | "TASK_ESCALATED_PM"
  | "TASK_ESCALATED_ADMIN"
  | "ADMIN_BROADCAST"
  | "SYSTEM_ALERT";

import { UserRole } from "./roles";

/**
 * Allowed task status transitions per role.
 * ADMIN is not in this map — ADMIN can set any status.
 */
export const TASK_STATUS_TRANSITIONS: Record<
  TaskStatus,
  Partial<Record<UserRole.EMPLOYEE | UserRole.PM, TaskStatus[]>>
> = {
  [TaskStatus.TODO]: {
    [UserRole.EMPLOYEE]: [TaskStatus.IN_PROGRESS],
    [UserRole.PM]: [
      TaskStatus.IN_PROGRESS,
      TaskStatus.BLOCKED,
      TaskStatus.DONE,
    ],
  },
  [TaskStatus.IN_PROGRESS]: {
    [UserRole.EMPLOYEE]: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED],
    [UserRole.PM]: [
      TaskStatus.IN_REVIEW,
      TaskStatus.BLOCKED,
      TaskStatus.DONE,
      TaskStatus.TODO,
    ],
  },
  [TaskStatus.IN_REVIEW]: {
    [UserRole.EMPLOYEE]: [],
    [UserRole.PM]: [TaskStatus.IN_PROGRESS, TaskStatus.DONE],
  },
  [TaskStatus.BLOCKED]: {
    [UserRole.EMPLOYEE]: [TaskStatus.IN_PROGRESS],
    [UserRole.PM]: [TaskStatus.IN_PROGRESS, TaskStatus.DONE],
  },
  [TaskStatus.DONE]: {
    [UserRole.EMPLOYEE]: [],
    [UserRole.PM]: [TaskStatus.IN_PROGRESS],
  },
};
