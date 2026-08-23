// apps/web/features/projects/projectsApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  UpdateProjectStatusInput,
} from "@hassad/shared";
import type { ProjectStatus } from "@hassad/shared";

// ── Response types ────────────────────────────────────────────────────────────

export interface ProjectListItem extends Project {
  client?: { id: string; companyName: string };
  manager?: { id: string; name: string } | null;
  _count?: { tasks: number };
  completionPercentage?: number;
}

export interface PmProjectCard {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  completionPercentage: number;
  startDate: string;
  endDate: string;
  projectManager: { id: string; name: string } | null;
  priority: ProjectListItem["priority"];
  taskCount: number;
  overdueTaskCount: number;
  activeTaskCount: number;
  updatedAt: string;
}

export interface PaginatedProjects {
  items: ProjectListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  page?: number;
  limit?: number;
  clientId?: string;
  projectManagerId?: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  uploadedBy: string;
  fileName: string;
  filePath?: string;
  fileType: string;
  fileSize?: number;
  uploadedAt: string;
  url?: string;
}

export interface PmRevisionRequest {
  id: string;
  deliverableId: string;
  clientId: string;
  requestDescription: string;
  status: string;
  resolvedAt?: string | null;
  createdAt: string;
  client?: { id: string; companyName: string };
}

export interface PmDeliverableWithRevisions {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: string;
  isVisibleToClient: boolean;
  createdAt: string;
  project?: { id: string; name: string };
  revisionRequests: PmRevisionRequest[];
}

// ── API slice ─────────────────────────────────────────────────────────────────

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery,
  tagTypes: ["Project", "ProjectFile", "PmRevision"],
  endpoints: (builder) => ({
    /** GET /v1/projects — paginated + filtered list */
    getProjects: builder.query<PaginatedProjects, ProjectFilters>({
      query: (filters = {}) => ({ url: "/projects", params: filters }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Project" as const,
                id,
              })),
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),

    /** GET /v1/projects/:id — single project with full relations */
    getProjectById: builder.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),

    /** POST /v1/projects — create a new project */
    createProject: builder.mutation<Project, CreateProjectInput>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    /** PATCH /v1/projects/:id — update general project fields */
    updateProject: builder.mutation<
      Project,
      { id: string; body: UpdateProjectInput }
    >({
      query: ({ id, body }) => ({
        url: `/projects/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
      ],
    }),

    /** PATCH /v1/projects/:id/status — dedicated status transition */
    updateProjectStatus: builder.mutation<
      Project,
      { id: string; body: UpdateProjectStatusInput }
    >({
      query: ({ id, body }) => ({
        url: `/projects/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
      ],
    }),

    /** DELETE /v1/projects/:id — hard delete (ADMIN only) */
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
      ],
    }),

    /** GET /v1/pm/projects/:id — PM-owned project detail */
    getPmProjectById: builder.query<Project, string>({
      query: (id) => `/pm/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),

    /** GET /v1/pm/projects/:id/files */
    getPmProjectFiles: builder.query<ProjectFile[], string>({
      query: (projectId) => `/pm/projects/${projectId}/files`,
      transformResponse: (response: { items: ProjectFile[] }) => response.items,
      providesTags: (_result, _error, projectId) => [
        { type: "ProjectFile", id: projectId },
      ],
    }),

    /** POST /v1/pm/projects/:id/files */
    uploadPmProjectFile: builder.mutation<
      ProjectFile,
      { projectId: string; file: File; periodId?: string }
    >({
      query: ({ projectId, file, periodId }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (periodId) formData.append("periodId", periodId);
        return {
          url: `/pm/projects/${projectId}/files`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectFile", id: projectId },
      ],
    }),

    /** GET /v1/pm/projects/:id/files/:fileId/download */
    getPmProjectFileDownload: builder.query<
      { url: string },
      { projectId: string; fileId: string }
    >({
      query: ({ projectId, fileId }) =>
        `/pm/projects/${projectId}/files/${fileId}/download`,
    }),

    /** DELETE /v1/pm/projects/:id/files/:fileId */
    deletePmProjectFile: builder.mutation<void, { projectId: string; fileId: string }>({
      query: ({ projectId, fileId }) => ({
        url: `/pm/projects/${projectId}/files/${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectFile", id: projectId },
      ],
    }),

    /** GET /v1/projects/:id/files — list project files */
    getProjectFiles: builder.query<ProjectFile[], string>({
      query: (projectId) => `/projects/${projectId}/files`,
      providesTags: (_result, _error, projectId) => [
        { type: "ProjectFile", id: projectId },
      ],
    }),

    /** POST /v1/projects/:id/files — upload a project file */
    uploadProjectFile: builder.mutation<
      ProjectFile,
      { projectId: string; file: File }
    >({
      query: ({ projectId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/projects/${projectId}/files`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectFile", id: projectId },
      ],
    }),

    /** DELETE /v1/projects/:id/files/:fileId — delete a project file */
    deleteProjectFile: builder.mutation<
      void,
      { projectId: string; fileId: string }
    >({
      query: ({ projectId, fileId }) => ({
        url: `/projects/${projectId}/files/${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectFile", id: projectId },
      ],
    }),

    /** GET /v1/pm/projects — PM-owned project cards */
    getPmProjects: builder.query<
      {
        items: PmProjectCard[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      },
      { search?: string; status?: ProjectStatus; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/pm/projects", params }),
      providesTags: [{ type: "Project", id: "PM_LIST" }],
    }),

    /** PM-owned paginated project cards adapted for the shared project table. */
    getPmProjectsTable: builder.query<PaginatedProjects, {
      search?: string;
      status?: ProjectStatus;
      page?: number;
      limit?: number;
    }>({
      query: (params) => ({ url: "/pm/projects", params }),
      transformResponse: (response: {
        items: PmProjectCard[];
        meta: Omit<PaginatedProjects, "items">;
      }): PaginatedProjects => ({
        items: response.items.map((project) => ({
          ...project,
          clientId: "",
          client: { id: "", companyName: project.clientName },
          manager: project.projectManager,
          _count: { tasks: project.taskCount },
          progress: project.completionPercentage,
          createdAt: project.updatedAt,
        }) as ProjectListItem),
        ...response.meta,
      }),
      providesTags: [{ type: "Project", id: "PM_TABLE" }],
    }),

    /** PATCH /v1/pm/projects/:id — PM-owned project update */
    updatePmProject: builder.mutation<
      Project,
      { id: string; body: UpdateProjectInput }
    >({
      query: ({ id, body }) => ({
        url: `/pm/projects/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "PM_LIST" },
        { type: "Project", id: "PM_TABLE" },
      ],
    }),

    /** PATCH /v1/pm/projects/:id/status — PM-owned status update */
    updatePmProjectStatus: builder.mutation<
      { id: string; status: ProjectStatus },
      { id: string; status: ProjectStatus }
    >({
      query: ({ id, status }) => ({
        url: `/pm/projects/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "PM_LIST" },
        { type: "Project", id: "PM_TABLE" },
      ],
    }),

    /** GET /v1/pm/requests — all revision requests across PM's projects */
    getPmRevisions: builder.query<PmDeliverableWithRevisions[], void>({
      query: () => "/pm/requests",
      providesTags: [{ type: "PmRevision", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetPmProjectsQuery,
  useGetPmProjectsTableQuery,
  useGetProjectByIdQuery,
  useGetPmProjectByIdQuery,
  useGetPmProjectFilesQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useUpdatePmProjectMutation,
  useUpdateProjectStatusMutation,
  useUpdatePmProjectStatusMutation,
  useDeleteProjectMutation,
  useGetProjectFilesQuery,
  useUploadProjectFileMutation,
  useUploadPmProjectFileMutation,
  useDeleteProjectFileMutation,
  useDeletePmProjectFileMutation,
  useLazyGetPmProjectFileDownloadQuery,
  useGetPmRevisionsQuery,
} = projectsApi;
