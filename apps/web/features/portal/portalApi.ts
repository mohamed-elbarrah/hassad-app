import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { ServiceItem, PaymentMethod, InvoiceStatus } from "@hassad/shared";
import type {
  PeriodGoal,
  MeetingStatus,
  DisputeStatus,
  DisputeCategory,
  DisputePriority,
} from "@hassad/shared";

// ─── Dispute Types ───────────────────────────────────────────────────────────

export interface DisputeSummary {
  id: string;
  ticketNumber: number;
  project: { id: string; name: string };
  pm: { id: string; name: string };
  title: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  openedAt: string;
  deadlineAt?: string;
  _count?: { messages: number };
}

export interface DisputeMessage {
  id: string;
  content: string;
  author: { id: string; name: string; avatarUrl?: string | null };
  createdAt: string;
}

export interface DisputeAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploader: { id: string; name: string };
}

export interface DisputeHistory {
  id: string;
  fromStatus?: DisputeStatus | null;
  toStatus: DisputeStatus;
  changedAt: string;
  note?: string | null;
  changer: { id: string; name: string };
}

export interface DisputeDetail extends DisputeSummary {
  description: string;
  messages: DisputeMessage[];
  attachments: DisputeAttachment[];
  history: DisputeHistory[];
  rejectionReason?: string | null;
  resolution?: string | null;
}

export interface CreateDisputeInput {
  projectId: string;
  category: DisputeCategory;
  title: string;
  description: string;
}

export interface CreateDisputeMessageInput {
  content: string;
}

export interface ClientConfirmInput {
  confirmed: boolean;
  feedback?: string;
}

export interface DisputeFilterInput {
  status?: DisputeStatus;
  page?: number;
  limit?: number;
}

export interface DisputeListResponse {
  data: DisputeSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  statusAr: string;
  progress: number;
  startDate: string;
  endDate: string;
  projectManager: {
    id: string;
    name: string;
    isOnline: boolean;
  } | null;
}

export interface ProjectProgress {
  projects: ProjectSummary[];
  overallProgress: number;
  totalProjects: number;
  activeProjects: number;
}

export interface PortalDashboardSummary {
  totalContracts: number;
  totalContractValue: number;
  totalOutstanding: number;
  activeProjects: number;
  activeCampaigns: number;
}

export interface PortalDashboard {
  summary: PortalDashboardSummary;
  recentContracts: any[];
  recentInvoices: any[];
  recentProjects: any[];
  recentCampaigns: any[];
  projectProgress: ProjectProgress | null;
}

export interface ActionItem {
  id: string;
  type:
    | "DELIVERABLE_APPROVAL"
    | "INVOICE_PAYMENT"
    | "PROPOSAL_REVIEW"
    | "CONTRACT_SIGN";
  title: string;
  subtitle: string;
  actionUrl: string;
  dueDate?: string;
  priority: "high" | "normal" | "low";
  createdAt: string;
}

export interface ActivityFeedItem {
  id: string;
  date: string;
  text: string;
  icon: "palette" | "file" | "trending" | "check" | "dollar";
}

export interface CampaignSummary {
  totalVisits: number;
  totalConversions: number;
  avgRoas: number;
  improvementPercent: number;
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

export interface PortalCampaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  startDate: string;
  endDate?: string;
  budgetTotal: number;
  budgetSpent: number;
  analytics: CampaignAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface PortalCampaignKpiSnapshot {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cpc: number;
  cpa: number;
  ctr: number;
  conversionRate: number;
  roas: number;
  source: string | null;
  recordedAt: string;
}

export interface PortalCampaignDetail extends PortalCampaign {
  kpiSnapshots: PortalCampaignKpiSnapshot[];
}

export interface PortalProjectList {
  data: ProjectSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface PortalRequestServiceSummary {
  id: string;
  quantity: number;
  name: string;
  nameAr?: string | null;
}

export interface PortalRequestDocumentSummary {
  id: string;
  title: string;
  status: string;
  url?: string | null;
  sentAt?: string | null;
  signedAt?: string | null;
}

export interface PortalRequestSummary {
  id: string;
  companyName: string;
  contactName: string;
  notes?: string | null;
  status: string;
  statusLabel: string;
  stageLabel: string;
  createdAt: string;
  updatedAt: string;
  services: PortalRequestServiceSummary[];
  latestProposal?: PortalRequestDocumentSummary | null;
  latestContract?: PortalRequestDocumentSummary | null;
}

export interface PortalRequestList {
  data: PortalRequestSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface PortalInvoiceSummary {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: string;
  dueDate: string;
  issueDate?: string;
  contract?: { id: string; title: string } | null;
  payments?: { amount: number; status: string }[];
}

export interface PortalFinanceSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalRemaining: number;
  nextInvoiceDueDate: string | null;
  nextInvoiceAmount: number;
}

export interface PortalContractSummary {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  proposal?: { id: string; title: string } | null;
  projectManager?: string | null;
}

export interface ReportKpiCard {
  metric: string;
  label: string;
  value: number;
  previousValue: number;
  trendPercent: number | null;
}

export interface ReportSmartTip {
  type: "budget" | "warning" | "insight";
  title: string;
  description: string;
}

export interface ReportTopCampaign {
  id: string;
  name: string;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  spend: number;
}

export interface ReportPlatformDistribution {
  platform: string;
  spend: number;
  percent: number;
}

export interface ReportSummary {
  kpiCards: ReportKpiCard[];
  smartTips: ReportSmartTip[];
  topCampaigns: ReportTopCampaign[];
  platformDistribution: ReportPlatformDistribution[];
  period: { dateFrom: string | null; dateTo: string | null };
}

export interface ReportTimelineDataset {
  label: string;
  data: number[];
  metric: string;
}

export interface ReportTimeline {
  labels: string[];
  datasets: ReportTimelineDataset[];
}

export interface ReviewProject {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  statusAr: string;
  priority: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  manager: { id: string; name: string; isOnline: boolean } | null;
  taskCount: number;
  deliverableCount: number;
}

export interface ProjectReviewRevision {
  id: string;
  comment: string;
  createdAt: string;
  client: { id: string; companyName: string };
}

export interface ProjectReviewDetail {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  clientId: string;
  projectManagerId?: string | null;
  createdAt: string;
  updatedAt: string;
  manager: { id: string; name: string; isOnline: boolean } | null;
  files: {
    id: string;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    url?: string;
  }[];
  revisionRequests: ProjectReviewRevision[];
}

export interface PortalPeriodFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  filePath?: string;
  url?: string | null;
}

export interface PortalPeriodInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  paidAmount: number;
  remainingAmount: number;
}

export interface PortalPeriodMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin?: number | null;
  location?: string | null;
  meetingLink?: string | null;
  status: MeetingStatus;
  notes?: string | null;
}

export interface PortalPeriodStats {
  goalsTotal: number;
  goalsCompleted: number;
  filesCount: number;
  reportsCount: number;
  hasReport: boolean;
  nextMeeting: {
    id: string;
    title: string;
    scheduledAt: string;
    status: MeetingStatus;
  } | null;
}

export interface PortalPeriodSummary {
  id: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "CLOSED" | "SUSPENDED";
  summary: string | null;
  reportFilePath: string | null;
  completionPercentage: number;
  goals: PeriodGoal[];
  files: PortalPeriodFile[];
  invoice: PortalPeriodInvoice | null;
  meetings: PortalPeriodMeeting[];
  stats: PortalPeriodStats;
}

export interface PortalProjectDetail {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  statusAr: string;
  priority: string;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  manager: { id: string; name: string; isOnline: boolean } | null;
  client: { id: string; companyName: string; contactName: string };
}

export interface PortalInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PortalInvoiceDetail {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  paidAmount: number;
  remainingAmount: number;
  notes?: string | null;
  currency: string;
  contract?: { id: string; title: string } | null;
  items: PortalInvoiceItem[];
  payments: { id: string; amount: number; status: string; createdAt: string }[];
}

export interface DownloadUrlResponse {
  url: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  roleType: "SALES" | "PM" | "ACCOUNT_MANAGER";
  isOnline: boolean;
  avatarUrl?: string | null;
}

export interface TeamMembersResponse {
  members: TeamMember[];
}

export interface IntakeFormDraft {
  currentStep?: number;
  communicationInfo?: Record<string, unknown>;
  productInfo?: Record<string, unknown>;
  audienceInfo?: Record<string, unknown>;
  brandVoice?: Record<string, unknown>;
  customerJourney?: Record<string, unknown>;
  campaignInfo?: Record<string, unknown>;
  pastPerformance?: Record<string, unknown>;
  budgetInfo?: Record<string, unknown>;
  visualIdentityInfo?: Record<string, unknown>;
}

/**
 * Shape of `GET /portal/contracts/:id` — mirrors the Prisma include in
 * `portal.service.ts:getContractById` (audit issue #14).
 *
 * `proposal` is typed as the full Proposal shape so future consumers can
 * safely access any field. Fields not currently read by the contract
 * detail page are present but not marked optional.
 */
export interface PortalContractClient {
  id: string;
  companyName: string;
  contactName: string;
}

export interface PortalContractInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PortalContractPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  date: string;
}

export interface PortalContractInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  paymentReference?: string | null;
  items?: PortalContractInvoiceItem[];
  payments?: PortalContractPayment[];
}

export interface PortalContractDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyValue: number;
  totalValue: number;
  filePath: string | null;
  shareLinkToken: string | null;
  versionNumber: number;
  eSigned: boolean;
  signedAt: string | null;
  createdAt: string;
  servicesList?: ServiceItem[] | null;
  client: PortalContractClient | null;
  proposal?: unknown;
  invoices: PortalContractInvoice[];
  request: { id: string; status: string } | null;
}

export const portalApi = createApi({
  reducerPath: "portalApi",
  baseQuery,
  tagTypes: [
    "PortalDashboard",
    "ProjectProgress",
    "PortalCampaigns",
    "ActionItems",
    "ActivityFeed",
    "CampaignSummary",
    "PortalCampaign",
    "PortalProjects",
    "PortalRequests",
    "PortalInvoices",
    "PortalContracts",
    "PortalReports",
    "ReviewProjects",
    "TeamMembers",
    "PortalStrategies",
    "ClientDisputes",
    "ClientDispute",
    "IntakeFormDraft",
  ],
  endpoints: (builder) => ({
    getPortalDashboard: builder.query<PortalDashboard, void>({
      query: () => "/portal/dashboard",
      providesTags: ["PortalDashboard"],
    }),
    getPortalFinanceSummary: builder.query<PortalFinanceSummary, void>({
      query: () => "/portal/finance/summary",
      providesTags: ["PortalInvoices"],
    }),
    getProjectProgress: builder.query<ProjectProgress | null, void>({
      query: () => "/portal/project-progress",
      providesTags: ["ProjectProgress"],
    }),
    getPortalProjects: builder.query<
      PortalProjectList,
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/portal/projects", params }),
      providesTags: ["PortalProjects"],
    }),
    getPortalRequests: builder.query<
      PortalRequestList,
      { page?: number; limit?: number } | void
    >({
      query: (params) =>
        params
          ? { url: "/portal/requests", params }
          : { url: "/portal/requests" },
      providesTags: ["PortalRequests"],
    }),
    // Optional `projectId` arg narrows the response to campaigns attached to a
    // specific project (used by the project-detail CampaignsTab). The full
    // campaigns page passes `undefined` to get all client campaigns.
    // (Audit issue #8)
    getPortalCampaigns: builder.query<
      PortalCampaign[],
      { projectId?: string; periodId?: string } | void
    >({
      query: (arg) => {
        // RTK Query passes `void` when called with no args; narrow at runtime.
        const { projectId, periodId } =
          typeof arg === "object" && arg !== null
            ? arg
            : { projectId: undefined, periodId: undefined };
        const params: Record<string, string> = {};
        if (projectId) params.projectId = projectId;
        if (periodId) params.periodId = periodId;
        return Object.keys(params).length > 0
          ? { url: "/portal/campaigns", params }
          : { url: "/portal/campaigns" };
      },
      providesTags: ["PortalCampaigns"],
    }),
    getPortalCampaign: builder.query<PortalCampaignDetail, string>({
      query: (id) => `/portal/campaigns/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PortalCampaign", id }],
    }),
    getActionItems: builder.query<
      { items: ActionItem[]; total: number; page: number; limit: number },
      { type?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/portal/action-items", params }),
      providesTags: ["ActionItems"],
    }),
    getActivityFeed: builder.query<{ items: ActivityFeedItem[] }, void>({
      query: () => "/portal/activity-feed",
      providesTags: ["ActivityFeed"],
    }),
    getCampaignSummary: builder.query<CampaignSummary, void>({
      query: () => "/portal/campaigns/summary",
      providesTags: ["CampaignSummary"],
    }),
    getPortalInvoices: builder.query<
      {
        data: PortalInvoiceSummary[];
        total: number;
        page: number;
        limit: number;
      },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/portal/invoices", params }),
      providesTags: ["PortalInvoices"],
    }),
    getPortalContracts: builder.query<
      {
        data: PortalContractSummary[];
        total: number;
        page: number;
        limit: number;
      },
      {
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({ url: "/portal/contracts", params }),
      providesTags: ["PortalContracts"],
    }),

    getPortalContractById: builder.query<PortalContractDetail, string>({
      query: (id) => `/portal/contracts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PortalContracts", id }],
    }),
    snoozeActionItem: builder.mutation<
      { id: string; snoozedUntil: string },
      { itemType: string; itemId: string; hours?: number }
    >({
      query: (body) => ({
        url: "/portal/action-items/snooze",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ActionItems", "ActivityFeed"], // NEW
    }),
    unsnoozeActionItem: builder.mutation<
      { success: boolean },
      { itemType: string; itemId: string }
    >({
      query: ({ itemType, itemId }) => ({
        url: `/portal/action-items/snooze/${itemType}/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ActionItems", "ActivityFeed"], // NEW
    }),

    // NEW: Deliverable approval
    approveDeliverable: builder.mutation<any, string>({
      query: (id) => ({
        url: `/deliverables/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["ActionItems", "ActivityFeed", "ProjectProgress"],
    }),

    rejectDeliverable: builder.mutation<any, string>({
      query: (id) => ({
        url: `/deliverables/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["ActionItems", "ActivityFeed", "ProjectProgress"],
    }),

    // NEW: Contract signing
    signContract: builder.mutation<any, string>({
      query: (id) => ({
        url: `/portal/contracts/${id}/sign`,
        method: "POST",
      }),
      invalidatesTags: ["PortalContracts", "ActionItems", "ActivityFeed"],
    }),

    getPortalReports: builder.query<ReportSummary, void>({
      query: () => "/portal/reports",
      providesTags: ["PortalReports"],
    }),
    getReportTimeline: builder.query<
      ReportTimeline,
      {
        dateFrom?: string;
        dateTo?: string;
        granularity?: "day" | "week" | "month";
      } | void
    >({
      query: (params) =>
        params
          ? { url: "/portal/reports/timeline", params }
          : { url: "/portal/reports/timeline" },
      providesTags: ["PortalReports"],
    }),

    getReviewProjects: builder.query<ReviewProject[], void>({
      query: () => "/portal/projects/review",
      providesTags: ["ReviewProjects"],
    }),

    getProjectReviewDetail: builder.query<ProjectReviewDetail, string>({
      query: (id) => `/portal/projects/${id}/review-detail`,
      providesTags: (_result, _error, id) => [{ type: "ReviewProjects", id }],
    }),

    approveProject: builder.mutation<any, string>({
      query: (id) => ({
        url: `/portal/projects/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: [
        "ReviewProjects",
        "ProjectProgress",
        "PortalProjects",
        "ActionItems", // NEW
        "ActivityFeed", // NEW
      ],
    }),

    requestProjectRevision: builder.mutation<
      any,
      { id: string; comment: string }
    >({
      query: ({ id, comment }) => ({
        url: `/portal/projects/${id}/request-revision`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: [
        "ReviewProjects",
        "ProjectProgress",
        "PortalProjects",
        "ActionItems", // NEW
        "ActivityFeed", // NEW
      ],
    }),

    getProjectRevisions: builder.query<ProjectReviewRevision[], string>({
      query: (id) => `/portal/projects/${id}/revisions`,
    }),

    // NOTE: both per-id endpoints below provide `[{ type: "PortalProjects", id }]`.
    // This is intentionally the SAME tag shape as the list endpoint
    // (`getPortalProjects`). RTK Query matches by tag identity, so any
    // mutation that invalidates `"PortalProjects"` (e.g. `approveProject`)
    // correctly refetches all three — list, detail, and periods. Do NOT
    // switch these to a different tag without updating every mutation that
    // invalidates the parent tag. (Audit issue #13)

    getPortalProjectPeriods: builder.query<PortalPeriodSummary[], string>({
      query: (projectId) => `/portal/projects/${projectId}/periods`,
      providesTags: (_result, _error, id) => [{ type: "PortalProjects", id }],
    }),

    getPortalProjectDetail: builder.query<PortalProjectDetail, string>({
      query: (projectId) => `/portal/projects/${projectId}`,
      providesTags: (_result, _error, id) => [{ type: "PortalProjects", id }],
    }),

    getPortalInvoiceDetail: builder.query<PortalInvoiceDetail, string>({
      query: (invoiceId) => `/portal/invoices/${invoiceId}`,
      providesTags: (_result, _error, id) => [{ type: "PortalInvoices", id }],
    }),

    downloadPeriodReport: builder.query<
      DownloadUrlResponse,
      { projectId: string; periodId: string }
    >({
      query: ({ projectId, periodId }) =>
        `/portal/projects/${projectId}/periods/${periodId}/report/download`,
    }),

    downloadPeriodFile: builder.query<
      DownloadUrlResponse,
      { projectId: string; periodId: string; fileId: string }
    >({
      query: ({ projectId, periodId, fileId }) =>
        `/portal/projects/${projectId}/periods/${periodId}/files/${fileId}/download`,
    }),

    getTeamMembers: builder.query<TeamMembersResponse, void>({
      query: () => "/portal/team-members",
      providesTags: ["TeamMembers"],
    }),

    // ── Marketing Strategy Portal Endpoints ────────────────────────────

    getClientStrategies: builder.query<any[], void>({
      query: () => "/portal/marketing-strategies",
      providesTags: ["PortalStrategies"],
    }),

    getClientStrategy: builder.query<any, string>({
      query: (id) => `/portal/marketing-strategies/${id}`,
      providesTags: (result, error, id) => [{ type: "PortalStrategies", id }],
    }),

    approveStrategy: builder.mutation<any, string>({
      query: (id) => ({
        url: `/portal/marketing-strategies/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: [
        "PortalStrategies",
        "ActionItems",
        "ActivityFeed", // NEW
      ],
    }),

    requestStrategyRevision: builder.mutation<
      any,
      { id: string; comment: string }
    >({
      query: ({ id, comment }) => ({
        url: `/portal/marketing-strategies/${id}/request-revision`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: [
        "PortalStrategies",
        "ActionItems",
        "ActivityFeed", // NEW
      ],
    }),

    // ─── Dispute Endpoints ──────────────────────────────────────────────────

    getClientDisputes: builder.query<
      DisputeListResponse,
      DisputeFilterInput | void
    >({
      query: (params) => ({
        url: "/portal/disputes",
        params: params || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "ClientDispute" as const,
                id,
              })),
              "ClientDisputes",
            ]
          : ["ClientDisputes"],
    }),

    getClientDisputeDetail: builder.query<DisputeDetail, string>({
      query: (id) => `/portal/disputes/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ClientDispute", id }],
    }),

    createDispute: builder.mutation<
      DisputeDetail,
      CreateDisputeInput & { files?: File[] }
    >({
      query: ({ files, ...data }) => {
        const formData = new FormData();
        formData.append("projectId", data.projectId);
        formData.append("category", data.category);
        formData.append("title", data.title);
        formData.append("description", data.description);
        if (files?.length) files.forEach((f) => formData.append("files", f));
        return { url: "/portal/disputes", method: "POST", body: formData };
      },
      invalidatesTags: ["ClientDisputes"],
    }),

    addDisputeMessage: builder.mutation<
      DisputeMessage,
      { disputeId: string; content: string; files?: File[] }
    >({
      query: ({ disputeId, content, files }) => {
        const formData = new FormData();
        formData.append("content", content);
        if (files?.length) files.forEach((f) => formData.append("files", f));
        return {
          url: `/portal/disputes/${disputeId}/messages`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { disputeId }) => [
        { type: "ClientDispute", id: disputeId },
      ],
    }),

    confirmDisputeResolution: builder.mutation<
      DisputeDetail,
      { disputeId: string; input: ClientConfirmInput }
    >({
      query: ({ disputeId, input }) => ({
        url: `/portal/disputes/${disputeId}/confirm`,
        method: "POST",
        body: input,
      }),
      invalidatesTags: (_result, _error, { disputeId }) => [
        { type: "ClientDispute", id: disputeId },
        "ClientDisputes",
      ],
    }),

    // ── Intake Form V2 ──────────────────────────────────────────────

    getIntakeFormDraft: builder.query<IntakeFormDraft | null, void>({
      query: () => "/portal/intake-form",
      providesTags: ["IntakeFormDraft"],
    }),

    saveIntakeFormDraft: builder.mutation<
      IntakeFormDraft,
      Partial<IntakeFormDraft>
    >({
      query: (body) => ({
        url: "/portal/intake-form/draft",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["IntakeFormDraft"],
    }),

    submitIntakeForm: builder.mutation<
      { success: boolean },
      Partial<IntakeFormDraft>
    >({
      query: (body) => ({
        url: "/portal/intake-form",
        method: "POST",
        body,
      }),
      invalidatesTags: ["IntakeFormDraft"],
    }),
  }),
});

export const {
  useGetPortalDashboardQuery,
  useGetPortalFinanceSummaryQuery,
  useGetProjectProgressQuery,
  useGetPortalProjectsQuery,
  useGetPortalRequestsQuery,
  useGetPortalCampaignsQuery,
  useGetPortalCampaignQuery,
  useGetActionItemsQuery,
  useGetActivityFeedQuery,
  useGetCampaignSummaryQuery,
  useGetPortalInvoicesQuery,
  useGetPortalContractsQuery,
  useGetPortalContractByIdQuery,
  useSnoozeActionItemMutation,
  useUnsnoozeActionItemMutation,
  // NEW: Deliverable approval
  useApproveDeliverableMutation,
  useRejectDeliverableMutation,
  // NEW: Contract signing
  useSignContractMutation,
  useGetPortalReportsQuery,
  useGetReportTimelineQuery,
  useGetReviewProjectsQuery,
  useGetProjectReviewDetailQuery,
  useApproveProjectMutation,
  useRequestProjectRevisionMutation,
  useGetProjectRevisionsQuery,
  useGetTeamMembersQuery,
  useGetPortalProjectPeriodsQuery,
  useLazyDownloadPeriodReportQuery,
  useLazyDownloadPeriodFileQuery,
  useGetPortalProjectDetailQuery,
  useGetPortalInvoiceDetailQuery,
  // Strategy hooks
  useGetClientStrategiesQuery,
  useGetClientStrategyQuery,
  useApproveStrategyMutation,
  useRequestStrategyRevisionMutation,
  // Dispute hooks
  useGetClientDisputesQuery,
  useGetClientDisputeDetailQuery,
  useCreateDisputeMutation,
  useAddDisputeMessageMutation,
  useConfirmDisputeResolutionMutation,
  // Intake Form V2 hooks
  useGetIntakeFormDraftQuery,
  useSaveIntakeFormDraftMutation,
  useSubmitIntakeFormMutation,
} = portalApi;
