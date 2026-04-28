import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { TaskStatus } from "@hassad/shared";

export interface Deliverable {
  id: string;
  projectId: string;
  taskId?: string | null;
  approvedBy?: string | null;
  title: string;
  description?: string | null;
  filePath: string;
  status: TaskStatus;
  isVisibleToClient: boolean;
  approvedAt?: string | null;
  createdAt: string;
  project?: { id: string; name: string };
  revisionRequests?: ClientRevisionRequest[];
}

export interface ClientRevisionRequest {
  id: string;
  deliverableId: string;
  requestedBy: string;
  description: string;
  status: TaskStatus;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface CreateDeliverableInput {
  projectId: string;
  title: string;
  filePath: string;
  description?: string;
  taskId?: string;
  isVisibleToClient?: boolean;
}

export interface CreateRevisionRequestInput {
  description: string;
}

export const deliverablesApi = createApi({
  reducerPath: "deliverablesApi",
  baseQuery,
  tagTypes: ["Deliverable", "Revision"],
  endpoints: (builder) => ({
    getDeliverablesByProject: builder.query<Deliverable[], string>({
      query: (projectId) => `/projects/${projectId}/deliverables`,
      providesTags: (_r, _e, projectId) => [{ type: "Deliverable", id: `PROJECT_${projectId}` }],
    }),
    getDeliverablesByClient: builder.query<Deliverable[], string>({
      query: (clientId) => `/clients/${clientId}/deliverables`,
      providesTags: (_r, _e, clientId) => [{ type: "Deliverable", id: `CLIENT_${clientId}` }],
    }),
    getDeliverableById: builder.query<Deliverable, string>({
      query: (id) => `/deliverables/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Deliverable", id }],
    }),
    createDeliverable: builder.mutation<Deliverable, CreateDeliverableInput>({
      query: (body) => ({ url: "/deliverables", method: "POST", body }),
      invalidatesTags: [{ type: "Deliverable", id: "LIST" }],
    }),
    approveDeliverable: builder.mutation<Deliverable, string>({
      query: (id) => ({ url: `/deliverables/${id}/approve`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Deliverable", id }],
    }),
    rejectDeliverable: builder.mutation<Deliverable, string>({
      query: (id) => ({ url: `/deliverables/${id}/reject`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Deliverable", id }],
    }),
    getRevisions: builder.query<ClientRevisionRequest[], string>({
      query: (deliverableId) => `/deliverables/${deliverableId}/revisions`,
      providesTags: (_r, _e, deliverableId) => [{ type: "Revision", id: deliverableId }],
    }),
    createRevision: builder.mutation<ClientRevisionRequest, { deliverableId: string; body: CreateRevisionRequestInput }>({
      query: ({ deliverableId, body }) => ({ url: `/deliverables/${deliverableId}/revisions`, method: "POST", body }),
      invalidatesTags: (_r, _e, { deliverableId }) => [{ type: "Revision", id: deliverableId }],
    }),
  }),
});

export const {
  useGetDeliverablesByProjectQuery,
  useGetDeliverablesByClientQuery,
  useGetDeliverableByIdQuery,
  useCreateDeliverableMutation,
  useApproveDeliverableMutation,
  useRejectDeliverableMutation,
  useGetRevisionsQuery,
  useCreateRevisionMutation,
} = deliverablesApi;
