export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const PROJECT_STATUS_AR: Record<ProjectStatus, string> = {
  PLANNING: 'تخطيط',
  ACTIVE: 'نشط',
  ON_HOLD: 'معلق',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  REVISION = 'REVISION',
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskDepartment {
  DESIGN = 'DESIGN',
  CONTENT = 'CONTENT',
  DEVELOPMENT = 'DEVELOPMENT',
  MARKETING = 'MARKETING',
  PRODUCTION = 'PRODUCTION',
}

export enum ProjectMemberRole {
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum FilePurpose {
  DELIVERABLE = 'DELIVERABLE',
  REFERENCE = 'REFERENCE',
  INTERNAL_DRAFT = 'INTERNAL_DRAFT',
}

export enum DelayAlertLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}
