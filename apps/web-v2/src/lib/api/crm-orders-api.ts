"use client";

import { baseApi } from "@/lib/api/base-api";
import type { CrmActionToast } from "@/lib/api/crm-action-toast";

export type CrmOrderNoteResponse = {
  note: unknown;
  toast: CrmActionToast;
};

export type CrmOrderStageResponse = {
  success: true;
  toast: CrmActionToast;
};

export const crmOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmOrderDetail: builder.query<unknown, string>({
      query: (id) => ({ url: `/crm/orders/${id}` }),
      providesTags: ["Crm"],
    }),
    createCrmOrderNote: builder.mutation<CrmOrderNoteResponse, { id: string; content: string }>({
      query: ({ id, content }) => ({
        url: `/crm/orders/${id}/notes`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Crm", "CrmOverview"],
    }),
    updateCrmOrderStage: builder.mutation<CrmOrderStageResponse, { id: string; toStage: string; note?: string }>({
      query: ({ id, toStage, note }) => ({
        url: `/crm/orders/${id}/stage`,
        method: "POST",
        body: { toStage, note },
      }),
      invalidatesTags: ["Crm", "CrmOverview"],
    }),
  }),
});

export const {
  useCreateCrmOrderNoteMutation,
  useGetCrmOrderDetailQuery,
  useUpdateCrmOrderStageMutation,
} = crmOrdersApi;
