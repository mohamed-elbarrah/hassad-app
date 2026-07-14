"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setDropdownOpen } from "@/features/notifications/notificationsSlice";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/features/notifications/notificationsApi";
import { UserRole } from "@hassad/shared";
import { NotificationDropdown } from "./NotificationDropdown";

export function resolveDashboardUrl(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  role: UserRole | string | undefined,
): string | null {
  if (!entityType || !entityId) return null;

  if (entityType === "task") {
    if (role === UserRole.TEAM) return `/dashboard/team/tasks/${entityId}`;
    if (role === UserRole.MARKETING)
      return `/dashboard/marketing/tasks/${entityId}`;
    if (role === UserRole.PM || role === UserRole.ADMIN)
      return `/dashboard/pm/tasks/${entityId}`;
    return `/dashboard/tasks/${entityId}`;
  }

  if (entityType === "project") return `/dashboard/pm/projects/${entityId}`;

  if (entityType === "proposal") return `/dashboard/sales/proposals`;

  if (entityType === "contract") return `/dashboard/sales/contracts`;

  if (entityType === "deliverable") return `/dashboard/tasks/${entityId}`;

  if (entityType === "campaign") return `/dashboard/marketing/campaigns`;

  if (entityType === "invoice" || entityType === "INVOICE")
    return `/dashboard/finance/invoices`;

  if (entityType === "conversation") return `/dashboard/messages`;

  return null;
}

function getDashboardActionLabel(
  entityType: string | null | undefined,
): string {
  if (entityType === "proposal") return "مراجعة العرض";
  if (entityType === "contract") return "مراجعة العقد";
  if (entityType === "deliverable") return "مراجعة التسليمة";
  if (entityType === "invoice" || entityType === "INVOICE")
    return "مراجعة الفاتورة";
  if (entityType === "project") return "متابعة المشروع";
  if (entityType === "campaign") return "عرض الحملة";
  if (entityType === "task") return "عرض المهمة";
  if (entityType === "conversation") return "عرض المحادثة";
  return "عرض التفاصيل";
}

export function DashboardNotificationsDropdown() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading } = useGetMyNotificationsQuery({ page: 1, limit: 5 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = (data?.data ?? []) as Array<{
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    entityType?: string | null;
    entityId?: string | null;
  }>;
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <NotificationDropdown
      notifications={notifications}
      isLoading={isLoading}
      hasUnread={hasUnread}
      allNotificationsUrl="/dashboard/notifications"
      resolveUrl={(entityType, entityId) =>
        resolveDashboardUrl(entityType, entityId, user?.role)
      }
      getActionLabel={getDashboardActionLabel}
      onMarkAsRead={(id) => markAsRead(id)}
      onMarkAllAsRead={() => markAllAsRead()}
      onClose={() => dispatch(setDropdownOpen(false))}
    />
  );
}
