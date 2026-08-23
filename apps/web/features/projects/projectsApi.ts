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
  filePath: string;
  fileType: string;
  fileSize: number;
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

    /** GET /v1/projects/pm/revisions — all revision requests across PM's projects */
    getPmRevisions: builder.query<PmDeliverableWithRevisions[], void>({
      query: () => "/projects/pm/revisions",
      providesTags: [{ type: "PmRevision", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useUpdateProjectStatusMutation,
  useDeleteProjectMutation,
  useGetProjectFilesQuery,
  useUploadProjectFileMutation,
  useDeleteProjectFileMutation,
  useGetPmRevisionsQuery,
} = projectsApi;
