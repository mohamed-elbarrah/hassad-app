import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export type AdminBackupScope = "DATABASE_ONLY" | "FULL_SYSTEM";
export type AdminBackupTrigger = "SCHEDULED" | "MANUAL";
export type AdminBackupStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export interface AdminBackup {
  id: string;
  scope: AdminBackupScope;
  trigger: AdminBackupTrigger;
  status: AdminBackupStatus;
  databaseKey: string | null;
  filesPrefix: string | null;
  checksum: string | null;
  sizeBytes: number | null;
  fileCount: number;
  appVersion: string | null;
  migrationVersion: string | null;
  createdById: string | null;
  errorCode: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  restoreOperation: {
    id: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
    errorCode: string | null;
    details: unknown;
    createdAt: string;
    completedAt: string | null;
  } | null;
}

export interface AdminBackupsResponse {
  items: AdminBackup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminBackupOperationResponse {
  backup: Pick<
    AdminBackup,
    "id" | "scope" | "trigger" | "status" | "createdAt"
  >;
  operation: { id: string; status: string };
}

export const adminBackupsApi = createApi({
  reducerPath: "adminBackupsApi",
  baseQuery,
  tagTypes: ["AdminBackups"],
  endpoints: (builder) => ({
    getAdminBackups: builder.query<
      AdminBackupsResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 25 } = {}) => ({
        url: "/admin/backups",
        params: { page, limit },
      }),
      providesTags: ["AdminBackups"],
    }),
    createAdminBackup: builder.mutation<
      AdminBackupOperationResponse,
      { scope: AdminBackupScope }
    >({
      query: (body) => ({
        url: "/admin/backups",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminBackups"],
    }),
    requestAdminBackupRestoreVerification: builder.mutation<
      { backup: { id: string; status: AdminBackupStatus }; operation: { id: string; status: string } },
      string
    >({
      query: (id) => ({
        url: `/admin/backups/${id}/restore-verification`,
        method: "POST",
      }),
      invalidatesTags: ["AdminBackups"],
    }),
    getAdminBackupDownloadUrl: builder.query<
      { url: string; expiresInSeconds: number },
      string
    >({
      query: (id) => `/admin/backups/${id}/download-url`,
    }),
  }),
});

export const {
  useGetAdminBackupsQuery,
  useCreateAdminBackupMutation,
  useRequestAdminBackupRestoreVerificationMutation,
  useLazyGetAdminBackupDownloadUrlQuery,
} = adminBackupsApi;
