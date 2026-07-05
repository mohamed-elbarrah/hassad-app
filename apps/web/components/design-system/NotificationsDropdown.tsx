"use client";

import { useAppDispatch } from "@/lib/hooks";
import { setDropdownOpen } from "@/features/notifications/notificationsSlice";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/features/portal-notifications/portalNotificationsApi";
import { NotificationDropdown } from "./NotificationDropdown";

function resolvePortalUrl(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "proposal") return `/portal/proposals/${entityId}`;
  if (entityType === "contract") return `/portal/contracts/${entityId}`;
  if (entityType === "deliverable") return `/portal/deliverables/${entityId}`;
  if (entityType === "project") return `/portal/projects`;
  if (entityType === "campaign") return `/portal/campaigns/${entityId}`;
  if (entityType === "marketing_strategy")
    return `/portal/marketing-strategies/${entityId}`;
  if (entityType === "invoice" || entityType === "INVOICE")
    return `/portal/finance`;
  if (entityType === "conversation") return `/portal/projects`;
  if (entityType === "payment" || entityType === "PAYMENT")
    return `/portal/finance`;
  return null;
}

function getPrimaryActionLabel(entityType: string | null | undefined): string {
  if (entityType === "proposal") return "مراجعة العرض";
  if (entityType === "contract") return "مراجعة العقد";
  if (entityType === "deliverable") return "مراجعة التسليمة";
  if (entityType === "invoice" || entityType === "INVOICE")
    return "دفع الفاتورة";
  if (entityType === "project") return "متابعة المشروع";
  if (entityType === "campaign") return "عرض الحملة";
  if (entityType === "marketing_strategy") return "مراجعة الدراسة التسويقية";
  return "عرض التفاصيل";
}

export function NotificationsDropdown() {
  const dispatch = useAppDispatch();

  const { data, isLoading } = useGetMyNotificationsQuery({ page: 1, limit: 5 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications =
    (
      data as unknown as {
        data?: {
          id: string;
          title: string;
          body: string;
          isRead: boolean;
          createdAt: string;
          entityType?: string | null;
          entityId?: string | null;
        }[];
      }
    )?.data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <NotificationDropdown
      notifications={notifications}
      isLoading={isLoading}
      hasUnread={hasUnread}
      allNotificationsUrl="/portal/notifications"
      resolveUrl={resolvePortalUrl}
      getActionLabel={getPrimaryActionLabel}
      onMarkAsRead={(id) => markAsRead(id)}
      onMarkAllAsRead={() => markAllAsRead()}
      onClose={() => dispatch(setDropdownOpen(false))}
    />
  );
}
