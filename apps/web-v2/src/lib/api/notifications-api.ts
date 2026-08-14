"use client";

import { baseApi } from "@/lib/api/base-api";

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  channel: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  entityId: string;
  entityType: string;
  eventType: string;
};

type NotificationsPage = {
  data: NotificationRecord[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
};

type UnreadCount = { count: number };

type NotificationsQuery = {
  page?: number;
  limit?: number;
  isRead?: boolean;
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsPage, NotificationsQuery | void>({
      query: (params) => ({ url: "/notifications/my", params: params ?? undefined }),
      providesTags: ["Notifications", "NotificationUnreadCount"],
    }),
    getNotificationUnreadCount: builder.query<UnreadCount, void>({
      query: () => "/notifications/my/unread-count",
      providesTags: ["NotificationUnreadCount"],
    }),
    markNotificationRead: builder.mutation<{ count: number }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications", "NotificationUnreadCount"],
    }),
    markAllNotificationsRead: builder.mutation<{ count: number }, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notifications", "NotificationUnreadCount"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
