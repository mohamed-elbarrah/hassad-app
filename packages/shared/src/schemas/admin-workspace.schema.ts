import type {
  ClientSource,
  CrmStage,
  PipelineStage,
  ProposalStatus,
  ClientKind,
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
  preset?: "30d" | "6m" | "12m";
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
  filter?: "all" | "clients" | "requests";
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
  kind?: "all" | "lead" | "order";
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
  currency: string;
  lastSeen: string | null;
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
  kind?: "lead" | "order";
  companyName: string;
  contactName: string;
  serviceLine: string;
  owner: string;
  source: ClientSource;
  stage: PipelineStage;
  crmStage?: CrmStage;
  stageTone: WorkspaceStatusTone;
  estimatedValue: number;
  currency: string;
  projectCount: number;
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
  currency: string;
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
    key: "revenue" | "activeClients" | "activeProjects" | "overdueTasks";
    value: number;
    change: number | null;
  }>;
  projectAmountChart: Array<{
    label: string;
    amount: number;
    currency: string;
  }>;
  invoiceChart: Array<{
    label: string;
    paid: number;
    unpaid: number;
    currency: string;
  }>;
  commercialChart: Array<{
    label: string;
    activeProjects: number;
    requests: number;
    contracts: number;
    offers: number;
  }>;
  funnel: {
    leads: number;
    clients: number;
    proposals: number;
    contracts: number;
    projects: number;
    invoices: number;
    payments: number;
    conversionRates: {
      requestsToOffers: number;
      offersToContracts: number;
      leadsToClients: number;
      clientsToProposals: number;
      proposalsToContracts: number;
      contractsToProjects: number;
      projectsToInvoices: number;
      invoicesToPayments: number;
    };
    contractStatusDistribution: Record<string, number>;
    dropOffs: {
      requestsToOffers: number;
      offersToContracts: number;
      contractsToProjects: number;
    };
  };
  leadOrders: Array<{
    id: string;
    clientName: string;
    companyName: string;
    stage: PipelineStage;
    crmStage?: CrmStage;
    stageTone: WorkspaceStatusTone;
    calls: number;
    meetings: number;
    projects: number;
    projectsTone: WorkspaceStatusTone;
    value: number;
    currency: string;
    owner: string;
    ownerInitials: string;
  }>;
  salesLeaders: Array<{
    id: string;
    name: string;
    initials: string;
    deals: number;
    contracts: number;
    revenue: number;
    currency: string;
  }>;
  activeProjects: Array<{
    id: string;
    name: string;
    clientName: string;
    state: ProjectStatus;
    stateTone: WorkspaceStatusTone;
    progress: number;
    pm: string;
    pmInitials: string;
    activeTasks: number;
    value: number;
    currency: string;
  }>;
  clients: Array<{
    id: string;
    clientName: string;
    companyName: string;
    kind: ClientKind;
    totalProjects: number;
    activeProjects: number;
    lastSeen: string | null;
    onlineTone: WorkspaceStatusTone;
    balance: number;
    currency: string;
  }>;
};
