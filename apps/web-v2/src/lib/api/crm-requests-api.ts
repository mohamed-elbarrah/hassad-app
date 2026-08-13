"use client";

import type { BusinessType, ClientSource } from "@hassad/shared";

import { baseApi } from "@/lib/api/base-api";

export type CrmRequestServiceInput = {
  serviceId: string;
  quantity?: number;
  notes?: string;
};

export type CrmRequestIntakePayload =
  | {
      mode: "existing";
      existingClient: { clientId: string };
      services: CrmRequestServiceInput[];
      notes?: string;
      source?: ClientSource;
    }
  | {
      mode: "new";
      newClient: {
        companyName: string;
        contactName: string;
        phoneWhatsapp: string;
        email: string;
        password: string;
        businessName: string;
        businessType: BusinessType;
        accountManager?: string;
      };
      services: CrmRequestServiceInput[];
      notes?: string;
      source?: ClientSource;
    };

export type CrmRequestIntakeResult = {
  request: {
    id: string;
    clientId: string;
  };
  client: {
    id: string;
    created: boolean;
    companyName: string;
  };
  toast: {
    type: "success" | "error" | "info" | "warning" | "loading";
    title: string;
    description?: string;
  };
};

export const crmRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCrmRequestIntake: builder.mutation<CrmRequestIntakeResult, CrmRequestIntakePayload>({
      query: (body) => ({
        url: "/crm/requests/intake",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CrmOverview", "Crm", "Clients"],
    }),
  }),
});

export const { useCreateCrmRequestIntakeMutation } = crmRequestsApi;
