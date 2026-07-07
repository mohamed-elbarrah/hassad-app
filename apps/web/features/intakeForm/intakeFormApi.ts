import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface IntakeFormItem {
  id: string;
  clientId: string;
  companyName: string;
  token: string;
  currentStep: number | null;
  isSubmitted: boolean;
  submittedAt: string | null;
  communicationInfo: Record<string, any> | null;
  productInfo: Record<string, any> | null;
  audienceInfo: Record<string, any> | null;
  brandVoice: Record<string, any> | null;
  customerJourney: Record<string, any> | null;
  campaignInfo: Record<string, any> | null;
  pastPerformance: Record<string, any> | null;
  budgetInfo: Record<string, any> | null;
  visualIdentityInfo: Record<string, any> | null;
  createdAt: string;
}

export interface PaginatedIntakeForms {
  items: IntakeFormItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const intakeFormApi = createApi({
  reducerPath: "intakeFormApi",
  baseQuery,
  tagTypes: ["IntakeForms"],
  endpoints: (builder) => ({
    getIntakeForms: builder.query<PaginatedIntakeForms, { clientId?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/admin/portal/intake-forms",
        params,
      }),
      providesTags: ["IntakeForms"],
    }),
  }),
});

export const { useGetIntakeFormsQuery } = intakeFormApi;
