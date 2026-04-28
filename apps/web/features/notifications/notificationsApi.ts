import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";
import type {
  Notification,
  UserRole,
  TaskDepartment,
} from "@hassad/shared";

// ── Local types ──────────────────────────────────────────────────────────────

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

export interface BroadcastNotificationInput {
  title: string;
  message: string;
  roles?: UserRole[];
  departments?: TaskDepartment[];
}

export interface BroadcastResult {
  sent: number;
}

export interface UnreadCountResult {
  count: number;
}

// Extend shared Notification to ensure string createdAt for API responses
export type NotificationItem = Omit<Notification, "createdAt"> & {
  createdAt: string;
  eventType: string;
  entityType?: string | null;
  entityId?: string | null;
};

// ── API slice ─────────────────────────────────────────────────────────────────

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery,
  tagTypes: ["Notification"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    /** GET /notifications/my — paginated list, supports isRead filter */
    getMyNotifications: builder.query<
      PaginatedNotifications,
      GetNotificationsParams
    >({
      query: ({ page = 1, limit = 20, isRead } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (isRead !== undefined) {
          params.set("isRead", String(isRead));
        }
        return `/notifications/my?${params.toString()}`;
      },
      providesTags: ["Notification"],
    }),

    /** GET /notifications/my/unread-count — returns { count: number } */
    getUnreadCount: builder.query<UnreadCountResult, void>({
      query: () => "/notifications/my/unread-count",
      providesTags: ["Notification"],
    }),

    /** PATCH /notifications/:id/read — mark single notification as read */
    markAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    /** PATCH /notifications/read-all — mark all as read */
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    /** POST /notifications/broadcast — ADMIN only */
    broadcastNotification: builder.mutation<
      BroadcastResult,
      BroadcastNotificationInput
    >({
      query: (body) => ({
        url: "/notifications/broadcast",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useBroadcastNotificationMutation,
} = notificationsApi;
