import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface ServiceCatalogItem {
  id: string;
  name: string;
  nameAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  category: string;
  estimatedDays: number;
  basePrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deliverableTemplates?: DeliverableTemplateItem[];
}

export interface DeliverableTemplateItem {
  id: string;
  serviceId: string;
  title: string;
  titleAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CreateServicePayload {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category: string;
  estimatedDays?: number;
  basePrice?: number;
  sortOrder?: number;
}

export interface UpdateServicePayload {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
  estimatedDays?: number;
  basePrice?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateDeliverableTemplatePayload {
  serviceId: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  sortOrder?: number;
}

export const servicesApi = createApi({
  reducerPath: "servicesApi",
  baseQuery,
  tagTypes: ["ServiceCatalog"],
  endpoints: (builder) => ({
    getServices: builder.query<
      ServiceCatalogItem[],
      { includeInactive?: boolean } | undefined
    >({
      query: (params) => ({
        url: "/services",
        params:
          params && params.includeInactive
            ? { includeInactive: "true" }
            : undefined,
      }),
      providesTags: ["ServiceCatalog"],
    }),
    getServiceById: builder.query<ServiceCatalogItem, string>({
      query: (id) => `/services/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ServiceCatalog", id }],
    }),
    createService: builder.mutation<ServiceCatalogItem, CreateServicePayload>({
      query: (body) => ({ url: "/services", method: "POST", body }),
      invalidatesTags: ["ServiceCatalog"],
    }),
    updateService: builder.mutation<
      ServiceCatalogItem,
      { id: string; body: UpdateServicePayload }
    >({
      query: ({ id, body }) => ({
        url: `/services/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ServiceCatalog"],
    }),
    deleteService: builder.mutation<void, string>({
      query: (id) => ({ url: `/services/${id}`, method: "DELETE" }),
      invalidatesTags: ["ServiceCatalog"],
    }),
    createDeliverableTemplate: builder.mutation<
      DeliverableTemplateItem,
      CreateDeliverableTemplatePayload
    >({
      query: (body) => ({
        url: "/services/deliverable-templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ServiceCatalog"],
    }),
    deleteDeliverableTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/services/deliverable-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceCatalog"],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useCreateDeliverableTemplateMutation,
  useDeleteDeliverableTemplateMutation,
} = servicesApi;
