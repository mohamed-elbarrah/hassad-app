"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch } from "@/lib/hooks";
import { setDropdownOpen } from "@/features/notifications/notificationsSlice";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/features/notifications/notificationsApi";
import type { NotificationItem } from "@/features/notifications/notificationsApi";
import Link from "next/link";

const ENTITY_URL_MAP: Record<string, (id: string) => string> = {
  task: (id) => `/dashboard/tasks/${id}`,
  project: (id) => `/dashboard/projects/${id}`,
};

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} دقيقة مضت`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعة مضت`;
  const days = Math.floor(hours / 24);
  return `${days} يوم مضى`;
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: NotificationItem;
  onRead: (
    id: string,
    entityType?: string | null,
    entityId?: string | null,
  ) => void;
}) {
  const entityUrl =
    notification.entityType && notification.entityId
      ? ENTITY_URL_MAP[notification.entityType]?.(notification.entityId)
      : null;

  return (
    <button
      className={`w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${
        !notification.isRead ? "bg-primary/5" : ""
      }`}
      onClick={() =>
        onRead(notification.id, notification.entityType, notification.entityId)
      }
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
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.createdAt as string)}
          </p>
        </div>
      </div>
      {entityUrl && (
        <span className="sr-only">انتقل إلى {notification.entityType}</span>
      )}
    </button>
  );
}

export function NotificationsDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGetMyNotificationsQuery({ page: 1, limit: 5 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        dispatch(setDropdownOpen(false));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch]);

  async function handleRead(
    id: string,
    entityType?: string | null,
    entityId?: string | null,
  ) {
    await markAsRead(id);
    dispatch(setDropdownOpen(false));
    if (entityType && entityId) {
      const url = ENTITY_URL_MAP[entityType]?.(entityId);
      if (url) router.push(url);
    }
  }

  const notifications = (data?.data ?? []) as unknown as NotificationItem[];
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 w-80 rounded-lg border bg-background shadow-lg z-50"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-semibold text-sm">الإشعارات</span>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => markAllAsRead()}
          >
            <CheckCheck className="h-3 w-3" />
            تعليم الكل كمقروء
          </Button>
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
            <NotificationItem key={n.id} notification={n} onRead={handleRead} />
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
  );
}
