// Enums
export * from "./enums/roles";
export * from "./enums/client";
export * from "./enums/project";

export * from "./enums/finance";
export * from "./enums/ai";
export * from "./enums/ai-assistant";
export * from "./enums/satisfaction";
export * from "./enums/workload";
export * from "./enums/campaign";
export * from "./enums/service";
export * from "./enums/dispute";
export * from "./enums/invoice";
export * from "./enums/payment";
export * from "./enums/lead";

// Schemas
export * from "./schemas/auth.schema";
export * from "./schemas/client.schema";
export * from "./schemas/contract.schema";
export * from "./schemas/proposal.schema";
export * from "./schemas/project.schema";
export * from "./schemas/user.schema";
export * from "./schemas/dispute.schema";
export * from "./schemas/intake-form-v2.schema";
export * from "./schemas/admin-workspace.schema";

import type { ServiceItem } from "./schemas/proposal.schema";

// ─── Interfaces (aligned to DB model) ─────────────────────────────────────────

import { UserRole } from "./enums/roles";
import {
  ClientKind,
  ClientStatus,
  CLIENT_STATUS_AR,
  BusinessType,
  ClientSource,
  ProposalStatus,
  ContractStatus,
  ContractType,
  PipelineStage,
  RequestStatus,
  AutomationStatus,
  DurationUnit,
} from "./enums/client";

import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  TaskDepartment,
  MarketingStrategyStatus,
  MARKETING_STRATEGY_STATUS_AR,
} from "./enums/project";
import {
  PaymentMethod,
  InvoiceStatus,
  TicketStatus,
  SalaryStatus,
  PaymentGatewayType,
  PaymentStatus,
  PaymentEventType,
  PayType,
} from "./enums/finance";
import {
  CampaignPlatform,
  CampaignStatus,
  KpiSource,
  SyncStatus,
} from "./enums/campaign";
import { ServiceCategory } from "./enums/service";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  department?: string | null;
  clientId?: string | null;
  intakeCompleted?: boolean;
  phoneWhatsapp?: string | null;
  avatarUrl?: string | null;
}

/** Matches the DB `Client` model exactly */
export interface Client {
  id: string;
  companyName: string;
  businessName: string;
  businessType: BusinessType;
  accountManager?: string | null;
  kind: ClientKind;
  status: ClientStatus;
  portalAccessToken?: string | null;
  portalTokenExpiresAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId?: string | null;
  intakeCompleted?: boolean;
  totalProjects?: number;
  activeProjects?: number;
  completedProjects?: number;
  cancelledProjects?: number;
  totalContractValue?: number;
  totalInvoiced?: number;
  totalPaid?: number;
  lastProjectAt?: Date | string | null;
  avgSatisfactionScore?: number | null;
  profile?: ClientProfile | null;
  manager?: { id: string; name: string } | null;
  historyLogs?: ClientHistoryLogItem[];
  // Personal identity (name, email, phone) is NOT here.
  // It lives on the linked `User` (joined via `userId`).
  user?: {
    id: string;
    name: string;
    email: string;
    phoneWhatsapp: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface ClientHistoryLogItem {
  id: string;
  clientId: string;
  userId: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  occurredAt: Date | string;
  user?: { id: string; name: string } | null;
}

// ── V2 Profile Types (unified with IntakeFormV2) ────────────────────────────────

export interface CommunicationInfo {
  contactName?: string;
  businessName?: string;
  businessType?: BusinessType;
  industry?: string;
  contactNumber?: string;
  email?: string;
}

export interface ProductInfo {
  productStory?: string;
  detailedDescription?: string;
  valueProposition?: string;
  advantages?: string;
  benefits?: string[];
  contentDirection?: string;
}

export interface FaqPair {
  question?: string;
  answer?: string;
}

export interface AudienceInfo {
  customerAnalysis?: string;
  faq?: FaqPair[];
}

export interface BrandVoice {
  toneOfVoice?: string;
  boundaries?: string;
  verbalSlogan?: string;
  appearanceMethod?: string;
}

export interface CustomerJourney {
  orderMethods?: string[];
  followUpTools?: string;
}

export interface CampaignInfo {
  campaignGoal?: string;
  campaignDetails?: string;
  campaignOffer?: string;
  guarantees?: string;
  campaignSeason?: string;
  competitors?: string;
}

export interface PastPerformance {
  bestCampaigns?: string;
  pastPerformance?: string;
  trackingSetup?: string;
}

export interface BudgetInfo {
  budgetRange?: number;
  previousReports?: string[];
}

export interface VisualIdentityBrandAssets {
  logoUrl?: string;
  brandColors?: string[];
  fonts?: string[];
  guidelinesUrl?: string;
}

export interface VisualIdentityInfo {
  hasVisualIdentity?: boolean;
  brandAssets?: VisualIdentityBrandAssets;
  pastDesigns?: string;
  productPhotos?: string[];
  visualDirection?: string[];
}

export interface ClientProfile {
  id: string;
  clientId: string;
  // Legacy fields (retained for backward compatibility)
  industry?: string | null;
  businessDescription?: string | null;
  targetAudience?: string | null;
  budgetRangeMin?: number | null;
  budgetRangeMax?: number | null;
  communicationPreference?: string | null;
  preferredLanguage?: string | null;
  timezone?: string | null;
  preferredPlatforms?: string | null;
  brandAssets?: {
    logoUrl?: string;
    brandColors?: string[];
    fonts?: string[];
    guidelinesUrl?: string;
  } | null;
  customFields?: Record<string, unknown> | null;
  website?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  twitterHandle?: string | null;
  linkedinUrl?: string | null;
  snapchatHandle?: string | null;
  workingHours?: string | null;
  decisionMakerName?: string | null;
  decisionMakerPhone?: string | null;
  painPoints?: string | null;
  // V2 fields (unified with IntakeFormV2)
  communicationInfo?: CommunicationInfo | null;
  productInfo?: ProductInfo | null;
  audienceInfo?: AudienceInfo | null;
  brandVoice?: BrandVoice | null;
  customerJourney?: CustomerJourney | null;
  campaignInfo?: CampaignInfo | null;
  pastPerformance?: PastPerformance | null;
  budgetInfo?: BudgetInfo | null;
  visualIdentityInfo?: VisualIdentityInfo | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Request {
  id: string;
  clientId: string;
  submittedBy?: string | null;
  assignedSalesId?: string | null;
  companyName: string;
  contactName: string;
  phoneWhatsapp: string;
  email?: string | null;
  businessName: string;
  businessType: BusinessType;
  source: ClientSource;
  notes?: string | null;
  status: RequestStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Input for POST /clients */
export interface CreateClientInput {
  companyName?: string;
  contactName?: string;
  phoneWhatsapp?: string;
  email?: string;
  businessName?: string;
  businessType?: BusinessType;
  accountManager?: string;
  password?: string;
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
  kind?: ClientKind;
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
  requestId?: string | null;
  createdBy: string;
  title: string;
  serviceDescription: string;
  servicesList: ServiceItem[];
  totalPrice: number;
  durationDays: number;
  durationUnit: string;
  filePath?: string | null;
  status: ProposalStatus;
  shareLinkToken?: string | null;
  sentAt?: Date | string | null;
  approvedAt?: Date | string | null;
  createdAt: Date | string;
}

/** Matches the DB `Contract` model exactly */
export interface Contract {
  id: string;
  requestId?: string | null;
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
  servicesList?: ServiceItem[];
  invoices?: Invoice[];
  proposal?: Proposal;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  requestId?: string | null;
  clientId: string;
  contractId?: string | null;
  projectManagerId?: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate: Date | string;
  endDate: Date | string;
  completionPercentage?: number;
  progress?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  manager?: { id: string; name: string } | null;
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
  revisionCount?: number;
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
  purpose?: string;
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

export interface TaskNote {
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
  isRead: boolean;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface NotificationEventPayload {
  id?: string;
  userId: string;
  eventType: string;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead?: boolean;
  createdAt?: Date | string;
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
  client?: any; // To be refined if needed
  contract?: any;
  payments?: any[];
  updatedAt: Date | string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId?: string | null;
  gatewayId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  providerPaymentId?: string | null;
  metadataJson?: any;
  notes?: string | null;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: PaymentGatewayType;
  isActive: boolean;
  configJson?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber?: string | null;
  iban: string;
  bankName: string;
  swiftCode?: string | null;
  instructions?: string | null;
  isDefault?: boolean;
  isActive: boolean;
  balance?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentEvent {
  id: string;
  paymentId: string;
  type: PaymentEventType;
  payloadJson?: any;
  createdAt: Date | string;
}

export interface WebhookLog {
  id: string;
  provider: string;
  eventType: string;
  payload: any;
  processed: boolean;
  error?: string | null;
  createdAt: Date | string;
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

export interface Employee {
  id: string;
  userId?: string | null;
  name: string;
  role: string;
  baseSalary: number;
  isActive: boolean;
  payType?: string;
  hourlyRate?: number | null;
  commissionRate?: number | null;
  monthlyTarget?: number | null;
  currency?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  salaries?: Salary[];
}

export interface Salary {
  id: string;
  employeeId: string;
  amount: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  status: SalaryStatus;
  paymentDate?: Date | string | null;
  month: number;
  year: number;
  notes?: string | null;
  createdAt: Date | string;
}

export interface Ledger {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId?: string | null;
  before?: any;
  after?: any;
  createdAt: Date | string;
}

export interface Campaign {
  id: string;
  taskId: string;
  clientId: string;
  projectId?: string | null;
  managedBy: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  startDate: Date | string;
  endDate?: Date | string | null;
  budgetTotal: number;
  budgetSpent: number;
  needsOptimization: boolean;
  isArchived: boolean;
  currency: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cpc: number;
  cpa: number;
  ctr: number;
  conversionRate: number;
  roas: number;
}

export interface CampaignWithAnalytics extends Campaign {
  analytics: CampaignAnalytics;
}

export interface ServiceCatalog {
  id: string;
  name: string;
  nameAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  category: ServiceCategory;
  estimatedDays: number;
  basePrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  deliverableTemplates?: DeliverableTemplate[];
}

export interface DeliverableTemplate {
  id: string;
  serviceId: string;
  title: string;
  titleAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  sortOrder: number;
  createdAt: Date | string;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  currentPhase: string;
  projectManager: {
    id: string;
    name: string;
    isOnline: boolean;
  } | null;
  deliverables: DeliverableSummary[];
  startDate: Date | string;
  endDate: Date | string;
}

export interface DeliverableSummary {
  id: string;
  title: string;
  titleAr?: string | null;
  status: string;
  statusAr: string;
  createdAt: Date | string;
}

// ─── Input types for schemas (also re-exported via wildcard above) ───────────
// Explicit re-exports for consumers that import by name
export * from "./schemas/payment.schema";
export * from "./schemas/campaign.schema";
export * from "./schemas/marketing-strategy.schema";
export type {
  CreateProposalInput,
  UpdateProposalInput,
  ProposalResponseInput,
} from "./schemas/proposal.schema";

export type {
  CreateContractInput,
  UpdateContractInput,
  SignContractInput,
} from "./schemas/contract.schema";
export type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./schemas/project.schema";
