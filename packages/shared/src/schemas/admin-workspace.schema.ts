import type {
  ClientSource,
  PipelineStage,
  ProposalStatus,
} from "../enums/client";
import type {
  ProjectStatus,
  TaskDepartment,
  TaskPriority,
} from "../enums/project";
import type { UserRole } from "../enums/roles";

export type WorkspaceStatusTone =
  | "success"
  | "warning"
  | "neutral"
  | "active"
  | "attention"
  | "destructive";

export type AdminOverviewQuery = {
  from?: string;
  to?: string;
  granularity?: "day" | "month" | "quarter" | "year";
};

export type AdminEmployeesWorkspaceQuery = {
  search?: string;
  status?: string;
  department?: string;
  roles?: string;
  page?: number;
  limit?: number;
};

export type AdminClientsWorkspaceQuery = {
  filter?: "all" | "clients" | "leads";
  sort?: "highest-spend" | "lowest-spend";
};

export type SalesClientsWorkspaceQuery = AdminClientsWorkspaceQuery;

export type ProposalWorkspaceQuery = {
  status?: string;
  search?: string;
  clientId?: string;
  creatorId?: string;
  page?: number;
  limit?: number;
};

export type SalesOffersWorkspaceQuery = Omit<ProposalWorkspaceQuery, "creatorId">;

export type AdminCrmWorkspaceQuery = {
  statusFilter?: "all" | "active" | "waiting-approval" | "stalled";
  dateFilter?: "all-time" | "last-7-days" | "last-30-days" | "last-90-days";
  valueFilter?:
    | "all-values"
    | "under-15000"
    | "15000-30000"
    | "30000-50000"
    | "50000-plus";
};

export type AdminDeliveryWorkspaceQuery = {
  search?: string;
  statusFilter?: "all" | "active" | "attention" | "completed";
  modelFilter?: "all-models" | "recurring" | "one-off";
  timelineFilter?: "all-timelines" | "ending-soon" | "overdue" | "archived";
  sort?: "highest-value" | "ending-soon" | "newest";
};

export type EmployeeWorkspaceRecord = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  department?: TaskDepartment;
  phoneWhatsapp?: string;
  lastSeen: string;
  isActive: boolean;
};

export type EmployeesWorkspaceResponse = {
  items: EmployeeWorkspaceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ClientWorkspaceRecord = {
  id: string;
  contactName: string;
  companyName: string;
  stage: "lead" | "active" | "completed";
  totalProjects: number;
  activeProjects: number;
  openOrders: number;
  pendingOffers: number;
  signedContracts: number;
  totalSpend: number;
  outstandingAmount: number;
  lastSeen: string;
  owner: string;
  stageTone: WorkspaceStatusTone;
  financeTone: WorkspaceStatusTone;
};

export type ClientsWorkspaceResponse = {
  items: ClientWorkspaceRecord[];
};

export type SalesClientWorkspaceRecord = Omit<ClientWorkspaceRecord, "owner">;

export type SalesClientsWorkspaceResponse = {
  items: SalesClientWorkspaceRecord[];
};

export type ProposalWorkspaceRecord = {
  id: string;
  title: string;
  clientName: string;
  requestName: string;
  creator: string;
  servicesCount: number;
  servicesLabel: string;
  totalValue: number;
  status: ProposalStatus;
  statusTone: WorkspaceStatusTone;
  sentAtLabel: string;
  sentDaysAgo: number;
  responseLabel: string;
  validUntilLabel: string;
  validityDaysLeft: number;
  validityTone: WorkspaceStatusTone;
  contractLabel: string;
  contractTone: WorkspaceStatusTone;
};

export type ProposalsWorkspaceResponse = {
  items: ProposalWorkspaceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SalesOfferWorkspaceRecord = Omit<ProposalWorkspaceRecord, "creator">;

export type SalesOffersWorkspaceResponse = {
  items: SalesOfferWorkspaceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CrmWorkspaceRecord = {
  id: string;
  companyName: string;
  contactName: string;
  serviceLine: string;
  owner: string;
  source: ClientSource;
  stage: PipelineStage;
  stageTone: WorkspaceStatusTone;
  estimatedValue: number;
  openedAt: string;
  openedDaysAgo: number;
  lastContact: string;
  nextFollowUp: string;
  nextStep: string;
  proposalStatus: ProposalStatus | null;
  proposalTone: WorkspaceStatusTone;
  contractState: string;
  contractTone: WorkspaceStatusTone;
  agingLabel: string;
  agingTone: WorkspaceStatusTone;
  waitingApproval: boolean;
  stalled: boolean;
  contactAttemptCount: number;
  meetingsCount: number;
  projectSignalLabel: string;
  projectSignalTone: WorkspaceStatusTone;
};

export type CrmWorkspaceResponse = {
  items: CrmWorkspaceRecord[];
};

export type DeliveryWorkspaceRecord = {
  id: string;
  name: string;
  clientName: string;
  projectManager: string;
  status: ProjectStatus;
  statusTone: WorkspaceStatusTone;
  archived: boolean;
  archivedTone: WorkspaceStatusTone;
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
  healthTone: WorkspaceStatusTone;
  currentPeriodLabel: string;
  currentPeriodStatusLabel: string;
  currentPeriodStatusTone: WorkspaceStatusTone;
  periodsCompleted: number;
  totalPeriods: number;
  activeTasksCount: number;
};

export type DeliveryWorkspaceResponse = {
  items: DeliveryWorkspaceRecord[];
};

export type AdminOverviewResponse = {
  granularity: "day" | "month" | "quarter" | "year";
  kpis: Array<{
    label: string;
    value: string;
    description: string;
    trend?: {
      label: string;
      tone: "success" | "warning" | "neutral";
    };
  }>;
  projectAmountChart: Array<{
    label: string;
    amount: number;
  }>;
  invoiceChart: Array<{
    label: string;
    paid: number;
    unpaid: number;
  }>;
  commercialChart: Array<{
    label: string;
    contracts: number;
    offers: number;
  }>;
  summaries: {
    projectAmount: string;
    paidInvoices: string;
    unpaidInvoices: string;
    activeContracts: string;
    offersSent: string;
  };
  leadOrders: Array<{
    id: string;
    clientName: string;
    companyName: string;
    stage: string;
    stageTone: WorkspaceStatusTone;
    calls: number;
    meetings: number;
    projects: string;
    value: string;
    lastActivity: string;
  }>;
  performance: {
    conversionRate: string;
    averageProjectValue: string;
    proposalToContractRate: string;
    activeProjects: string;
  };
};
