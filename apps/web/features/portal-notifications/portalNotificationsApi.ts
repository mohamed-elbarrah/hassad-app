import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type { Notification } from "@hassad/shared";

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface UnreadCountResult {
  count: number;
}

export type PortalNotificationItem = Omit<Notification, "createdAt"> & {
  createdAt: string;
  eventType: string;
  entityType?: string | null;
  entityId?: string | null;
};

export const portalNotificationsApi = createApi({
  reducerPath: "portalNotificationsApi",
  baseQuery,
  tagTypes: ["PortalNotification"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getMyNotifications: builder.query<PaginatedNotifications, GetNotificationsParams>({
      query: ({ page = 1, limit = 20, isRead } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (isRead !== undefined) {
          params.set("isRead", String(isRead));
        }
        return `/portal-notifications?${params.toString()}`;
      },
      providesTags: ["PortalNotification"],
    }),

    getUnreadCount: builder.query<UnreadCountResult, void>({
      query: () => "/portal-notifications/unread-count",
      providesTags: ["PortalNotification"],
    }),

    markAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/portal-notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["PortalNotification"],
    }),

    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/portal-notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["PortalNotification"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = portalNotificationsApi;
