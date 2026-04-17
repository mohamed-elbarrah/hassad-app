// Enums
export * from "./enums/roles";
export * from "./enums/client";

// Schemas
export * from "./schemas/auth.schema";
export * from "./schemas/client.schema";

// ─── Legacy interfaces (still used by API and Web) ────────────────────────────

import { UserRole } from "./enums/roles";
import { ClientStatus, PipelineStage, BusinessType } from "./enums/client";

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
}
