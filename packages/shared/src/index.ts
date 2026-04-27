// Enums
export * from "./enums/roles";
export * from "./enums/client";
export * from "./enums/project";
export * from "./enums/marketing";
export * from "./enums/finance";
export * from "./enums/ai";
export * from "./enums/satisfaction";
export * from "./enums/workload";

// Schemas
export * from "./schemas/auth.schema";
export * from "./schemas/client.schema";
export * from "./schemas/contract.schema";
export * from "./schemas/proposal.schema";
export * from "./schemas/project.schema";
export * from "./schemas/user.schema";

// ─── Legacy interfaces (still used by API and Web) ────────────────────────────

import { UserRole } from "./enums/roles";
import {
  ClientStatus,
  PipelineStage,
  BusinessType,
  ProposalStatus,
  ContractStatus,
} from "./enums/client";
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  TaskDepartment,
} from "./enums/project";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  isActive?: boolean;
}

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  businessType: BusinessType;
  source: string;
  status: ClientStatus;
  stage: PipelineStage;
  assignedToId: string;
  createdAt: Date;
  updatedAt: Date;
  requirements?: Record<string, unknown> | null;
  activityLog?: Array<Record<string, unknown>> | null;
  contactAttempts?: number | null;
  lastContactAttemptAt?: Date | null;
  nextFollowUpAt?: Date | null;
  followUpStep?: number | null;
}

export interface Proposal {
  id: string;
  clientId: string;
  services: string[];
  price: number;
  startDate: Date;
  notes?: string | null;
  status: ProposalStatus;
  shareToken?: string | null;
  sentAt?: Date | null;
  approvedAt?: Date | null;
  revisionNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  clientId: string;
  services: string[];
  startDate: Date;
  endDate: Date;
  value: number;
  status: ContractStatus;
  fileUrl?: string | null;
  sentAt?: Date | null;
  signedAt?: Date | null;
  signedByName?: string | null;
  signedByEmail?: string | null;
  signatureUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  contractId?: string | null;
  managerId: string;
  status: ProjectStatus;
  progress: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  assignedTo: string;
  dept: TaskDepartment;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFile {
  id: string;
  taskId: string;
  uploadedById: string;
  uploadedBy?: { id: string; name: string };
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user?: { id: string; name: string };
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  entityId?: string | null;
  entityType?: string | null;
  createdAt: Date;
}
