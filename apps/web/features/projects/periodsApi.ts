import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface PeriodGoal {
  title: string;
  description?: string;
  completed: boolean;
}

export interface PeriodFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  filePath?: string;
}

export interface ProjectPeriod {
  id: string;
  projectId: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "CLOSED" | "SUSPENDED";
  summary: string | null;
  reportFilePath: string | null;
  completionPercentage: number;
  goals: PeriodGoal[] | null;
  invoiceId: string | null;
  closedAt: string | null;
  suspendedAt: string | null;
  resumedAt: string | null;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
  } | null;
  files?: PeriodFile[];
  tasksByStatus?: Record<string, number>;
  taskCount?: number;
  deliverableCount?: number;
  fileCount?: number;
  campaignCount?: number;
  satisfactionRating?: {
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
  } | null;
  statusHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    reason: string | null;
    changedAt: string;
    changedByUser?: { id: string; name: string };
  }>;
}

export const periodsApi = createApi({
  reducerPath: "periodsApi",
  baseQuery,
  tagTypes: ["ProjectPeriod"],
  endpoints: (builder) => ({
    // List periods for a project
    getProjectPeriods: builder.query<ProjectPeriod[], string>({
      query: (projectId) => `/projects/${projectId}/periods`,
      providesTags: (_, __, projectId) => [{ type: "ProjectPeriod", id: `list-${projectId}` }],
    }),

    // Get period detail
    getPeriodDetail: builder.query<ProjectPeriod, string>({
      query: (periodId) => `/projects/periods/${periodId}`,
      providesTags: (_, __, periodId) => [{ type: "ProjectPeriod", id: periodId }],
    }),

    // Close period
    closePeriod: builder.mutation<ProjectPeriod, { periodId: string; reason?: string }>({
      query: ({ periodId, reason }) => ({
        url: `/projects/periods/${periodId}/close`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    // Open period (PM opens early)
    openPeriod: builder.mutation<ProjectPeriod, string>({
      query: (periodId) => ({
        url: `/projects/periods/${periodId}/open`,
        method: "POST",
      }),
      invalidatesTags: (_, __, periodId) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    // Extend period
    extendPeriod: builder.mutation<ProjectPeriod, { periodId: string; endDate: string }>({
      query: ({ periodId, endDate }) => ({
        url: `/projects/periods/${periodId}/extend`,
        method: "PATCH",
        body: { endDate },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    // Create extra period
    createExtraPeriod: builder.mutation<ProjectPeriod, string>({
      query: (projectId) => ({
        url: `/projects/${projectId}/periods/extra`,
        method: "POST",
      }),
      invalidatesTags: (_, __, projectId) => [
        { type: "ProjectPeriod", id: `list-${projectId}` },
      ],
    }),

    // Save summary
    savePeriodSummary: builder.mutation<ProjectPeriod, { periodId: string; summary: string }>({
      query: ({ periodId, summary }) => ({
        url: `/projects/periods/${periodId}/summary`,
        method: "PATCH",
        body: { summary },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    // Set completion percentage
    setPeriodCompletion: builder.mutation<ProjectPeriod, { periodId: string; completionPercentage: number }>({
      query: ({ periodId, completionPercentage }) => ({
        url: `/projects/periods/${periodId}/completion`,
        method: "PATCH",
        body: { completionPercentage },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    // Save goals
    savePeriodGoals: builder.mutation<ProjectPeriod, { periodId: string; goals: PeriodGoal[] }>({
      query: ({ periodId, goals }) => ({
        url: `/projects/periods/${periodId}/goals`,
        method: "PATCH",
        body: { goals },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    // Upload report
    uploadPeriodReport: builder.mutation<{ filePath: string }, { periodId: string; file: File }>({
      queryFn: async ({ periodId, file }, _api, _extraOptions, baseQueryFn) => {
        const formData = new FormData();
        formData.append("file", file);
        
        const result = await baseQueryFn({
          url: `/projects/periods/${periodId}/report`,
          method: "POST",
          body: formData,
          // @ts-ignore - FormData handling
          formData: true,
        });
        
        if (result.error) {
          return { error: result.error };
        }
        return { data: result.data as { filePath: string } };
      },
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),
  }),
});

export const {
  useGetProjectPeriodsQuery,
  useGetPeriodDetailQuery,
  useClosePeriodMutation,
  useOpenPeriodMutation,
  useExtendPeriodMutation,
  useCreateExtraPeriodMutation,
  useSavePeriodSummaryMutation,
  useSetPeriodCompletionMutation,
  useSavePeriodGoalsMutation,
  useUploadPeriodReportMutation,
} = periodsApi;