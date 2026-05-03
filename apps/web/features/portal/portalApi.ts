import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface DeliverableSummary {
  id: string;
  title: string;
  titleAr?: string | null;
  status: string;
  statusAr: string;
  createdAt: string;
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
  startDate: string;
  endDate: string;
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

export const portalApi = createApi({
  reducerPath: "portalApi",
  baseQuery,
  tagTypes: ["PortalDashboard", "ProjectProgress", "PortalCampaigns"],
  endpoints: (builder) => ({
    getPortalDashboard: builder.query<PortalDashboard, void>({
      query: () => "/portal/dashboard",
      providesTags: ["PortalDashboard"],
    }),
    getProjectProgress: builder.query<ProjectProgress | null, void>({
      query: () => "/portal/project-progress",
      providesTags: ["ProjectProgress"],
    }),
    getPortalCampaigns: builder.query<any[], void>({
      query: () => "/portal/campaigns",
      providesTags: ["PortalCampaigns"],
    }),
  }),
});

export const {
  useGetPortalDashboardQuery,
  useGetProjectProgressQuery,
  useGetPortalCampaignsQuery,
} = portalApi;