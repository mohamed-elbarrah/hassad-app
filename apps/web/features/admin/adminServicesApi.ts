import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  CreateDeliverableTemplatePayload,
  CreateServicePayload,
  DeliverableTemplateItem,
  ServiceCatalogItem,
  UpdateServicePayload,
} from "@/features/services/servicesApi";

export type { CreateServicePayload, ServiceCatalogItem, UpdateServicePayload };

export const adminServicesApi = createApi({
  reducerPath: "adminServicesApi",
  baseQuery,
  tagTypes: ["AdminServiceCatalog"],
  endpoints: (builder) => ({
    getAdminServices: builder.query<ServiceCatalogItem[], void>({
      query: () => "/admin/services",
      providesTags: (result) =>
        result
          ? [
              ...result.map((service) => ({
                type: "AdminServiceCatalog" as const,
                id: service.id,
              })),
              { type: "AdminServiceCatalog" as const, id: "LIST" },
            ]
          : [{ type: "AdminServiceCatalog" as const, id: "LIST" }],
    }),
    getAdminServiceById: builder.query<ServiceCatalogItem, string>({
      query: (id) => `/admin/services/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "AdminServiceCatalog", id },
      ],
    }),
    createAdminService: builder.mutation<
      ServiceCatalogItem,
      CreateServicePayload
    >({
      query: (body) => ({ url: "/admin/services", method: "POST", body }),
      invalidatesTags: [{ type: "AdminServiceCatalog", id: "LIST" }],
    }),
    updateAdminService: builder.mutation<
      ServiceCatalogItem,
      { id: string; body: UpdateServicePayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/services/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminServiceCatalog", id },
        { type: "AdminServiceCatalog", id: "LIST" },
      ],
    }),
    archiveAdminService: builder.mutation<ServiceCatalogItem, string>({
      query: (id) => ({
        url: `/admin/services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminServiceCatalog", id: "LIST" }],
    }),
    addAdminDeliverable: builder.mutation<
      DeliverableTemplateItem,
      {
        serviceId: string;
        body: Omit<CreateDeliverableTemplatePayload, "serviceId">;
      }
    >({
      query: ({ serviceId, body }) => ({
        url: `/admin/services/${serviceId}/deliverables`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { serviceId }) => [
        { type: "AdminServiceCatalog", id: serviceId },
        { type: "AdminServiceCatalog", id: "LIST" },
      ],
    }),
    removeAdminDeliverable: builder.mutation<
      void,
      { serviceId: string; deliverableId: string }
    >({
      query: ({ serviceId, deliverableId }) => ({
        url: `/admin/services/${serviceId}/deliverables/${deliverableId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { serviceId }) => [
        { type: "AdminServiceCatalog", id: serviceId },
        { type: "AdminServiceCatalog", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAdminServicesQuery,
  useGetAdminServiceByIdQuery,
  useCreateAdminServiceMutation,
  useUpdateAdminServiceMutation,
  useArchiveAdminServiceMutation,
  useAddAdminDeliverableMutation,
  useRemoveAdminDeliverableMutation,
} = adminServicesApi;
