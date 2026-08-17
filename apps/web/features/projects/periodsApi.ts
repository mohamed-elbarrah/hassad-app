import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { MeetingStatus, PeriodGoal } from "@hassad/shared";

// ── Types ────────────────────────────────────────────────────────────────────

export type { PeriodGoal, MeetingStatus };

export interface PeriodFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  filePath?: string;
}

export interface ProjectMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin?: number | null;
  location?: string | null;
  meetingLink?: string | null;
  status: MeetingStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
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
  meetings?: ProjectMeeting[];
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

export interface CreateMeetingInput {
  title: string;
  scheduledAt: string;
  durationMin?: number;
  location?: string;
  meetingLink?: string;
}

export interface UpdateMeetingInput {
  title?: string;
  scheduledAt?: string;
  durationMin?: number;
  location?: string;
  meetingLink?: string;
  status?: MeetingStatus;
  notes?: string;
}

export interface DownloadUrlResponse {
  url: string;
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const periodsApi = createApi({
  reducerPath: "periodsApi",
  baseQuery,
  tagTypes: ["ProjectPeriod"],
  endpoints: (builder) => ({
    /** GET /v1/projects/:id/periods — list periods (with meetings) */
    getProjectPeriods: builder.query<ProjectPeriod[], string>({
      query: (projectId) => `/projects/${projectId}/periods`,
      providesTags: (_, __, projectId) => [
        { type: "ProjectPeriod", id: `list-${projectId}` },
      ],
    }),

    /** GET /v1/projects/periods/:periodId — single period detail */
    getPeriodDetail: builder.query<ProjectPeriod, string>({
      query: (periodId) => `/projects/periods/${periodId}`,
      providesTags: (_, __, periodId) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** POST /v1/projects/periods/:periodId/close */
    closePeriod: builder.mutation<
      ProjectPeriod,
      { periodId: string; reason?: string }
    >({
      query: ({ periodId, reason }) => ({
        url: `/projects/periods/${periodId}/close`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** POST /v1/projects/periods/:periodId/open */
    openPeriod: builder.mutation<ProjectPeriod, string>({
      query: (periodId) => ({
        url: `/projects/periods/${periodId}/open`,
        method: "POST",
      }),
      invalidatesTags: (_, __, periodId) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** PATCH /v1/projects/periods/:periodId/extend */
    extendPeriod: builder.mutation<
      ProjectPeriod,
      { periodId: string; endDate: string }
    >({
      query: ({ periodId, endDate }) => ({
        url: `/projects/periods/${periodId}/extend`,
        method: "PATCH",
        body: { endDate },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** POST /v1/projects/:id/periods/extra — append an extra period */
    generatePeriods: builder.mutation<ProjectPeriod[], string>({
      query: (projectId) => ({
        url: "/projects/" + projectId + "/periods/generate",
        method: "POST",
      }),
      invalidatesTags: (_, __, projectId) => [
        { type: "ProjectPeriod", id: "list-" + projectId },
      ],
    }),

    createExtraPeriod: builder.mutation<ProjectPeriod, string>({
      query: (projectId) => ({
        url: `/projects/${projectId}/periods/extra`,
        method: "POST",
      }),
      invalidatesTags: (_, __, projectId) => [
        { type: "ProjectPeriod", id: `list-${projectId}` },
      ],
    }),

    /** PATCH /v1/projects/periods/:periodId/summary */
    savePeriodSummary: builder.mutation<
      ProjectPeriod,
      { periodId: string; summary: string }
    >({
      query: ({ periodId, summary }) => ({
        url: `/projects/periods/${periodId}/summary`,
        method: "PATCH",
        body: { summary },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** PATCH /v1/projects/periods/:periodId/completion */
    setPeriodCompletion: builder.mutation<
      ProjectPeriod,
      { periodId: string; completionPercentage: number }
    >({
      query: ({ periodId, completionPercentage }) => ({
        url: `/projects/periods/${periodId}/completion`,
        method: "PATCH",
        body: { completionPercentage },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** PATCH /v1/projects/periods/:periodId/goals */
    savePeriodGoals: builder.mutation<
      ProjectPeriod,
      { periodId: string; goals: PeriodGoal[] }
    >({
      query: ({ periodId, goals }) => ({
        url: `/projects/periods/${periodId}/goals`,
        method: "PATCH",
        body: { goals },
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** POST /v1/projects/periods/:periodId/report — upload report file */
    uploadPeriodReport: builder.mutation<
      ProjectPeriod,
      { periodId: string; file: File }
    >({
      query: ({ periodId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/projects/periods/${periodId}/report`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** GET /v1/projects/periods/:periodId/report/download — presigned URL */
    downloadPeriodReport: builder.query<DownloadUrlResponse, string>({
      query: (periodId) => `/projects/periods/${periodId}/report/download`,
    }),

    /** POST /v1/projects/periods/:periodId/meetings — schedule a meeting */
    createMeeting: builder.mutation<
      ProjectMeeting,
      { periodId: string; body: CreateMeetingInput }
    >({
      query: ({ periodId, body }) => ({
        url: `/projects/periods/${periodId}/meetings`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { periodId }) => [
        { type: "ProjectPeriod", id: periodId },
      ],
    }),

    /** PATCH /v1/projects/meetings/:meetingId — update / reschedule / cancel / mark done */
    updateMeeting: builder.mutation<
      ProjectMeeting,
      { meetingId: string; periodId: string; body: UpdateMeetingInput }
    >({
      query: ({ meetingId, body }) => ({
        url: `/projects/meetings/${meetingId}`,
        method: "PATCH",
        body,
      }),
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
  useGeneratePeriodsMutation,
  useSavePeriodSummaryMutation,
  useSetPeriodCompletionMutation,
  useSavePeriodGoalsMutation,
  useUploadPeriodReportMutation,
  useLazyDownloadPeriodReportQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
} = periodsApi;
