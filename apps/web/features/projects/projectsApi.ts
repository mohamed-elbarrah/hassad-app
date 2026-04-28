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

export interface PaginatedProjects {
  items: Project[];
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

// ── API slice ─────────────────────────────────────────────────────────────────

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery,
  tagTypes: ["Project"],
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
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useUpdateProjectStatusMutation,
  useDeleteProjectMutation,
} = projectsApi;
