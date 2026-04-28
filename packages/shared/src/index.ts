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

// ─── Interfaces (aligned to DB model) ─────────────────────────────────────────

import { UserRole } from "./enums/roles";
import {
  ClientStatus,
  BusinessType,
  ProposalStatus,
  ContractStatus,
  ContractType,
  PipelineStage,
} from "./enums/client";
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  TaskDepartment,
} from "./enums/project";
import { PaymentMethod, InvoiceStatus, TicketStatus } from "./enums/finance";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  department?: string | null;
  clientId?: string | null;
}

/** Matches the DB `Client` model exactly */
export interface Client {
  id: string;
  leadId?: string | null;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string | null;
  businessName: string;
  businessType: BusinessType;
  accountManager?: string | null;
  status: ClientStatus;
  portalAccessToken?: string | null;
  portalTokenExpiresAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Input for POST /clients */
export interface CreateClientInput {
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string;
  businessName: string;
  businessType: BusinessType;
  accountManager?: string;
}

/** Input for PATCH /clients/:id */
export interface UpdateClientInput {
  companyName?: string;
  contactName?: string;
  phoneWhatsapp?: string;
  email?: string;
  businessName?: string;
  businessType?: BusinessType;
  accountManager?: string;
  status?: ClientStatus;
}

/** Input for POST /clients/:id/handover */
export interface HandoverClientInput {
  name: string;
  managerId: string;
  startDate: string;
  endDate: string;
}

/** Matches the DB `Proposal` model exactly */
export interface Proposal {
  id: string;
  leadId?: string | null;
  createdBy: string;
  title: string;
  serviceDescription: string;
  servicesList: unknown[];
  totalPrice: number;
  durationDays: number;
  platforms: string[];
  status: ProposalStatus;
  shareLinkToken?: string | null;
  sentAt?: Date | string | null;
  approvedAt?: Date | string | null;
  createdAt: Date | string;
}

/** Matches the DB `Contract` model exactly */
export interface Contract {
  id: string;
  clientId: string;
  proposalId?: string | null;
  createdBy: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  startDate: Date | string;
  endDate: Date | string;
  monthlyValue: number;
  totalValue: number;
  filePath?: string | null;
  versionNumber: number;
  eSigned: boolean;
  signedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  contractId?: string | null;
  projectManagerId?: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate: Date | string;
  endDate: Date | string;
  progress?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  projectId: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  assignedTo?: string | null;
  createdBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string;
  isArchived?: boolean;
  archivedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TaskFile {
  id: string;
  taskId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date | string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user?: { id: string; name: string };
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notification {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  body: string;
  isRead: boolean;
  entityId?: string | null;
  entityType?: string | null;
  createdAt: Date | string;
}

export interface Invoice {
  id: string;
  clientId: string;
  contractId?: string | null;
  createdBy: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  issueDate: Date | string;
  dueDate: Date | string;
  paidAt?: Date | string | null;
  sentAt?: Date | string | null;
  paymentReference?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentTicket {
  id: string;
  invoiceId: string;
  clientId: string;
  assignedTo?: string | null;
  status: TicketStatus;
  notes?: string | null;
  createdAt: Date | string;
  resolvedAt?: Date | string | null;
}

// ─── Input types for schemas (also re-exported via wildcard above) ───────────
// Explicit re-exports for consumers that import by name
export type { CreateProposalInput, UpdateProposalInput, ProposalResponseInput } from "./schemas/proposal.schema";
export type { CreateContractInput, UpdateContractInput, SignContractInput } from "./schemas/contract.schema";
export type { CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from "./schemas/project.schema";
