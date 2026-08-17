import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface NotificationTemplate {
  id: string;
  eventType: string;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationTemplatesApi = createApi({
  reducerPath: "notificationTemplatesApi",
  baseQuery,
  tagTypes: ["NotificationTemplate"],
  endpoints: (builder) => ({
    getNotificationTemplates: builder.query<NotificationTemplate[], void>({
      query: () => "/notification-templates",
      providesTags: ["NotificationTemplate"],
    }),

    getNotificationTemplate: builder.query<NotificationTemplate, string>({
      query: (id) => `/notification-templates/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "NotificationTemplate", id },
      ],
    }),

    updateNotificationTemplate: builder.mutation<
      NotificationTemplate,
      { id: string; title?: string; body?: string; isActive?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/notification-templates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["NotificationTemplate"],
    }),
  }),
});

export const {
  useGetNotificationTemplatesQuery,
  useGetNotificationTemplateQuery,
  useUpdateNotificationTemplateMutation,
} = notificationTemplatesApi;
