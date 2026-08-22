"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, BellOff, ExternalLink } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/design-system/Dialog";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setDropdownOpen } from "@/features/notifications/notificationsSlice";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/features/notifications/notificationsApi";
import type { NotificationItem } from "@/features/notifications/notificationsApi";
import Link from "next/link";
import { UserRole } from "@hassad/shared";
import { formatRelativeTime } from "@/lib/format";

// Role-aware URL resolver — uses canonical redirect which handles EMPLOYEE/PM/ADMIN
export function resolveEntityUrl(
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
  if (entityType === "project") {
    if (role === UserRole.CLIENT) return `/portal/projects`;
    return `/dashboard/pm/projects/${entityId}`;
  }
  if (entityType === "proposal") {
    if (role === UserRole.CLIENT) return `/portal/proposals/${entityId}`;
    return `/dashboard/sales/proposals/${entityId}`;
  }
  if (entityType === "contract") {
    if (role === UserRole.CLIENT) return `/portal/contracts/${entityId}`;
    return `/dashboard/sales/contracts/${entityId}`;
  }
  if (entityType === "deliverable") {
    if (role === UserRole.CLIENT) return `/portal/deliverables/${entityId}`;
    return `/dashboard/tasks/${entityId}`;
  }
  if (entityType === "campaign") {
    if (role === UserRole.CLIENT) return `/portal/campaigns/${entityId}`;
    return `/dashboard/marketing/campaigns/${entityId}`;
  }
  if (entityType === "marketing_strategy") {
    if (role === UserRole.CLIENT)
      return `/portal/marketing-strategies/${entityId}`;
    if (role === UserRole.MARKETING)
      return `/dashboard/marketing/tasks/${entityId}`;
    return `/dashboard/marketing`;
  }
  if (entityType === "invoice" || entityType === "INVOICE") {
    if (role === UserRole.CLIENT) return `/portal/finance`;
    if (role === UserRole.ADMIN)
      return `/dashboard/admin/finance/invoices/${entityId}`;
    return `/dashboard/finance/invoices/${entityId}`;
  }
  if (entityType === "conversation") {
    if (role === UserRole.CLIENT) return `/portal/projects`;
    return `/dashboard/messages`;
  }
  return null;
}

function NotificationListItem({
  notification,
  onSelect,
}: {
  notification: NotificationItem;
  onSelect: (n: NotificationItem) => void;
}) {
  return (
    <button
      className={`w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${
        !notification.isRead ? "bg-primary/5" : ""
      }`}
      onClick={() => onSelect(notification)}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && (
          <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
        )}
        <div className={`flex-1 min-w-0 ${notification.isRead ? "pr-4" : ""}`}>
          <p
            className={`text-sm truncate ${!notification.isRead ? "font-medium" : ""}`}
          >
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.createdAt as string)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function NotificationsDropdown() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  const { data, isLoading } = useGetMyNotificationsQuery({ page: 1, limit: 5 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  // Close dropdown on outside click (but not when modal is open)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !selectedNotification
      ) {
        dispatch(setDropdownOpen(false));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch, selectedNotification]);

  async function handleSelect(notification: NotificationItem) {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setSelectedNotification(notification);
  }

  function handleNavigateToEntity() {
    if (!selectedNotification) return;
    const url = resolveEntityUrl(
      selectedNotification.entityType,
      selectedNotification.entityId,
      user?.role,
    );
    if (url) {
      setSelectedNotification(null);
      dispatch(setDropdownOpen(false));
      router.push(url);
    }
  }

  const entityUrl = selectedNotification
    ? resolveEntityUrl(
        selectedNotification.entityType,
        selectedNotification.entityId,
        user?.role,
      )
    : null;

  const notifications = (data?.data ?? []) as unknown as NotificationItem[];
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  return (
    <>
      <div
        ref={ref}
        className="absolute top-full left-0 mt-2 w-80 rounded-lg border bg-background shadow-lg z-50"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">الإشعارات</span>
          {hasUnread && (
            <ActionButton
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllAsRead()}
              icon={<CheckCheck className="h-3 w-3" />}
            >
              تعليم الكل كمقروء
            </ActionButton>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <BellOff className="h-8 w-8 mb-2" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationListItem
                key={n.id}
                notification={n}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t">
          <Link
            href="/dashboard/notifications"
            className="text-xs text-primary hover:underline"
            onClick={() => dispatch(setDropdownOpen(false))}
          >
            عرض الكل
          </Link>
        </div>
      </div>

      {/* Notification detail modal */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
        title={selectedNotification?.title}
        description={
          selectedNotification?.createdAt
            ? formatRelativeTime(selectedNotification.createdAt as string)
            : ""
        }
        contentClassName="max-w-md"
        footer={
          <div className="flex flex-row-reverse gap-2">
            {entityUrl && (
              <ActionButton
                size="sm"
                className="gap-1"
                onClick={handleNavigateToEntity}
                icon={<ExternalLink className="h-3.5 w-3.5" />}
              >
                {selectedNotification?.entityType === "task"
                  ? "فتح المهمة"
                  : selectedNotification?.entityType === "project"
                    ? "فتح المشروع"
                    : selectedNotification?.entityType === "proposal"
                      ? "عرض العروض"
                      : selectedNotification?.entityType === "contract"
                        ? "عرض العقود"
                        : selectedNotification?.entityType ===
                            "marketing_strategy"
                          ? "مراجعة الدراسة"
                          : "فتح"}
              </ActionButton>
            )}
            <ActionButton
              variant="outline"
              size="sm"
              onClick={() => setSelectedNotification(null)}
            >
              إغلاق
            </ActionButton>
          </div>
        }
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {selectedNotification?.body}
        </p>
      </Dialog>
    </>
  );
}
