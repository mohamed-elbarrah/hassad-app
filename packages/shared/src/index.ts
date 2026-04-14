import { z } from 'zod';
export * from './enums/roles';
export * from './schemas/auth.schema';

export enum ClientStatus {
  LEAD = 'LEAD',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum BusinessType {
  RESTAURANT = 'RESTAURANT',
  CLINIC = 'CLINIC',
  STORE = 'STORE',
  SERVICE = 'SERVICE',
}

export enum ClientSource {
  AD = 'AD',
  REFERRAL = 'REFERRAL',
  WEBSITE = 'WEBSITE',
  WHATSAPP = 'WHATSAPP',
  PLATFORM = 'PLATFORM',
}

import { UserRole } from './enums/roles';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  businessName: string;
  businessType: BusinessType;
  status: ClientStatus;
  pipelineStage: string;
  assignedTo: string;
  createdAt: Date;
}

export const ClientSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  businessName: z.string(),
  businessType: z.string(),
  source: z.string(),
  status: z.nativeEnum(ClientStatus),
  pipelineStage: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  assignedTo: z.string(),
});

export const ProjectSchema = z.object({
  id: z.string().cuid(),
  clientId: z.string(),
  contractId: z.string(),
  managerId: z.string(),
  status: z.string(),
  progress: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ContractSchema = z.object({
  id: z.string().cuid(),
  clientId: z.string(),
  services: z.any(),
  startDate: z.date(),
  endDate: z.date(),
  value: z.number(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const TaskSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string(),
  assignedTo: z.string(),
  dept: z.string(),
  status: z.string(),
  dueDate: z.date(),
  priority: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InvoiceSchema = z.object({
  id: z.string().cuid(),
  clientId: z.string(),
  amount: z.number(),
  status: z.string(),
  dueDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
