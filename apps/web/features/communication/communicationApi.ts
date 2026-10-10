import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export type AnnouncementType = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
export type AnnouncementPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type AnnouncementAudience =
  | "ALL_STAFF"
  | "ADMIN"
  | "PM"
  | "SALES"
  | "MARKETING"
  | "ACCOUNTANT"
  | "TEAM"
  | "CLIENT_PORTAL";
export type IssueCategory =
  | "BUG"
  | "PERFORMANCE"
  | "ACCESS"
  | "DATA"
  | "PAYMENT"
  | "OTHER";
export type IssueSeverity = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type IssueStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  startsAt: string | null;
  expiresAt: string | null;
  allowDismissal: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
  publishedAt: string | null;
  audiences?: Array<{ audience: AnnouncementAudience }>;
}

export interface PaginatedCommunication<T> { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }

export interface AnnouncementInput {
  title: string;
  body: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  audiences: AnnouncementAudience[];
  startsAt?: string;
  expiresAt?: string;
  allowDismissal?: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

export interface IssueAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export interface IssueReport {
  id: string;
  reportNumber: number;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  availableTransitions?: IssueStatus[];
  source?: "DASHBOARD" | "PORTAL";
  pagePath?: string | null;
  createdAt: string;
  reporter?: { id: string; name: string; email?: string };
  assignedTo?: { id: string; name: string } | null;
  attachments?: IssueAttachment[];
  messages?: Array<{ id: string; content: string; createdAt: string; author: { id: string; name: string }; attachments?: IssueAttachment[] }>;
  history?: Array<{ id: string; eventCode: string; createdAt: string }>;
}

export interface CreateIssueInput {
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  pagePath?: string;
  files?: File[];
}

export const communicationApi = createApi({
  reducerPath: "communicationApi",
  baseQuery,
  tagTypes: ["Announcement", "Issue"],
  endpoints: (builder) => ({
    getActiveAnnouncements: builder.query<Announcement[], "dashboard" | "portal">({
      query: (surface) => `/${surface}/announcements/active`,
      providesTags: ["Announcement"],
      keepUnusedDataFor: 60,
    }),
    viewAnnouncement: builder.mutation<void, { surface: "dashboard" | "portal"; id: string }>({
      query: ({ surface, id }) => ({ url: `/${surface}/announcements/${id}/view`, method: "POST" }),
    }),
    dismissAnnouncement: builder.mutation<void, { surface: "dashboard" | "portal"; id: string }>({
      query: ({ surface, id }) => ({ url: `/${surface}/announcements/${id}/dismiss`, method: "POST" }),
      invalidatesTags: ["Announcement"],
    }),
    getMyIssues: builder.query<IssueReport[], "dashboard" | "portal">({
      query: (surface) => `/${surface}/issues`,
      providesTags: ["Issue"],
    }),
    getMyIssue: builder.query<IssueReport, { surface: "dashboard" | "portal"; id: string }>({
      query: ({ surface, id }) => `/${surface}/issues/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: "Issue", id }],
    }),
    addMyIssueMessage: builder.mutation<unknown, { surface: "dashboard" | "portal"; id: string; content: string; files?: File[] }>({
      query: ({ surface, id, content, files = [] }) => {
        const body = new FormData(); body.append("content", content); files.forEach((file) => body.append("files", file));
        return { url: `/${surface}/issues/${id}/messages`, method: "POST", body };
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "Issue", id }, "Issue"],
    }),
    createIssueReport: builder.mutation<IssueReport, { surface: "dashboard" | "portal"; input: CreateIssueInput }>({
      query: ({ surface, input }) => {
        const body = new FormData();
        body.append("category", input.category); body.append("severity", input.severity); body.append("title", input.title); body.append("description", input.description);
        if (input.pagePath) body.append("pagePath", input.pagePath);
        input.files?.forEach((file) => body.append("files", file));
        return { url: `/${surface}/issues`, method: "POST", body };
      },
      invalidatesTags: ["Issue"],
    }),
    createAnnouncement: builder.mutation<Announcement, AnnouncementInput>({
      query: (body) => ({ url: "/admin/announcements", method: "POST", body }),
      invalidatesTags: ["Announcement"],
    }),
    updateAnnouncement: builder.mutation<Announcement, { id: string; input: AnnouncementInput }>({
      query: ({ id, input }) => ({ url: `/admin/announcements/${id}`, method: "PATCH", body: input }),
      invalidatesTags: ["Announcement"],
    }),
    getAdminAnnouncements: builder.query<PaginatedCommunication<Announcement>, { page?: number; search?: string }>({
      query: (params) => {
        const options: { page?: number; search?: string } = params;
        const query = new URLSearchParams({ page: String(options.page ?? 1), limit: "20" });
        if (options.search) query.set("search", options.search);
        return `/admin/announcements?${query.toString()}`;
      },
      providesTags: ["Announcement"],
    }),
    publishAnnouncement: builder.mutation<Announcement, string>({
      query: (id) => ({ url: `/admin/announcements/${id}/publish`, method: "POST" }),
      invalidatesTags: ["Announcement"],
    }),
    archiveAnnouncement: builder.mutation<{ id: string; status: string }, string>({
      query: (id) => ({ url: `/admin/announcements/${id}/archive`, method: "POST" }),
      invalidatesTags: ["Announcement"],
    }),
    getAdminIssues: builder.query<PaginatedCommunication<IssueReport>, { page?: number; search?: string; status?: IssueStatus }>({
      query: (params) => {
        const options: { page?: number; search?: string; status?: IssueStatus } = params;
        const query = new URLSearchParams({ page: String(options.page ?? 1), limit: "20" });
        if (options.search) query.set("search", options.search);
        if (options.status) query.set("status", options.status);
        return `/admin/issues?${query.toString()}`;
      },
      providesTags: ["Issue"],
    }),
    getIssueAssignees: builder.query<Array<{ id: string; name: string; email: string }>, string | void>({
      query: (search) => `/admin/issues/assignees${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      providesTags: ["Issue"],
    }),
    getAdminIssue: builder.query<IssueReport, string>({
      query: (id) => `/admin/issues/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Issue", id }],
    }),
    addAdminIssueMessage: builder.mutation<unknown, { id: string; content: string; files?: File[] }>({
      query: ({ id, content, files = [] }) => {
        const body = new FormData(); body.append("content", content); files.forEach((file) => body.append("files", file));
        return { url: `/admin/issues/${id}/messages`, method: "POST", body };
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "Issue", id }, "Issue"],
    }),
    assignIssue: builder.mutation<IssueReport, { id: string; assignedToId?: string }>({
      query: ({ id, assignedToId }) => ({ url: `/admin/issues/${id}/assignment`, method: "PATCH", body: { assignedToId } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Issue", id }, "Issue"],
    }),
    updateIssueStatus: builder.mutation<IssueReport, { id: string; status: IssueStatus }>({
      query: ({ id, status }) => ({ url: `/admin/issues/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Issue", id }, "Issue"],
    }),
  }),
});

export const {
  useGetActiveAnnouncementsQuery,
  useViewAnnouncementMutation,
  useDismissAnnouncementMutation,
  useGetMyIssuesQuery,
  useGetMyIssueQuery,
  useAddMyIssueMessageMutation,
  useCreateIssueReportMutation,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useGetAdminAnnouncementsQuery,
  usePublishAnnouncementMutation,
  useArchiveAnnouncementMutation,
  useGetAdminIssuesQuery,
  useGetIssueAssigneesQuery,
  useGetAdminIssueQuery,
  useAddAdminIssueMessageMutation,
  useAssignIssueMutation,
  useUpdateIssueStatusMutation,
} = communicationApi;
