export * from './enums/roles';
export * from './schemas/auth.schema';

export enum ClientStatus {
  LEAD = 'LEAD',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
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
