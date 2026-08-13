"use client";

import { baseApi } from "@/lib/api/base-api";

export type ServiceCatalogItem = {
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
};

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<ServiceCatalogItem[], { includeInactive?: boolean } | void>({
      query: (params) => ({
        url: "/services",
        params: params && "includeInactive" in params && params.includeInactive ? { includeInactive: "true" } : undefined,
      }),
    }),
  }),
});

export const { useGetServicesQuery } = servicesApi;
