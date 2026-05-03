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

export const servicesApi = createApi({
  reducerPath: "servicesApi",
  baseQuery,
  tagTypes: ["ServiceCatalog"],
  endpoints: (builder) => ({
    getServices: builder.query<ServiceCatalogItem[], { includeInactive?: boolean } | undefined>({
      query: (params) => ({
        url: "/services",
        params: params && params.includeInactive ? { includeInactive: "true" } : undefined,
      }),
      providesTags: ["ServiceCatalog"],
    }),
    getServiceById: builder.query<ServiceCatalogItem, string>({
      query: (id) => `/services/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ServiceCatalog", id }],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
} = servicesApi;