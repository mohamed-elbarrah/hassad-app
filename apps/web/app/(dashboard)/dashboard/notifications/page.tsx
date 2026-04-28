"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/features/notifications/notificationsApi";
import type { NotificationItem } from "@/features/notifications/notificationsApi";
import { useAppSelector } from "@/lib/hooks";
import { UserRole } from "@hassad/shared";

// Role-aware task URL resolver
function resolveEntityUrl(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  role: UserRole | string | undefined,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "task") {
    if (role === UserRole.EMPLOYEE)
      return `/dashboard/employee/tasks/${entityId}`;
    if (role === UserRole.PM || role === UserRole.ADMIN)
      return `/dashboard/pm/tasks/${entityId}`;
    return `/dashboard/tasks/${entityId}`;
  }
  if (entityType === "project") {
    return `/dashboard/pm/projects/${entityId}`;
  }
  return null;
}

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

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  const { data, isLoading, isFetching } = useGetMyNotificationsQuery({
    page,
    limit: PAGE_SIZE,
    isRead: filter === "unread" ? false : undefined,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = (data?.data ?? []) as unknown as NotificationItem[];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  async function handleClickNotification(notification: NotificationItem) {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h1 className="text-xl font-semibold">الإشعارات</h1>
          {data?.unreadCount ? (
            <span className="text-sm text-muted-foreground">
              ({data.unreadCount} غير مقروء)
            </span>
          ) : null}
        </div>

        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => markAllAsRead()}
          >
            <CheckCheck className="h-4 w-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
          >
            {f === "all" ? "الكل" : "غير المقروءة"}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="rounded-lg border overflow-hidden">
        {isLoading || isFetching ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b last:border-0">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-10 w-10 mb-3" />
            <p className="text-base">
              {filter === "unread"
                ? "لا توجد إشعارات غير مقروءة"
                : "لا توجد إشعارات"}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              className={`w-full text-right px-4 py-4 hover:bg-muted/50 transition-colors border-b last:border-0 ${
                !notification.isRead ? "bg-primary/5" : ""
              }`}
              onClick={() => handleClickNotification(notification)}
            >
              <div className="flex items-start gap-3">
                {!notification.isRead && (
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />
                )}
                <div
                  className={`flex-1 min-w-0 ${notification.isRead ? "pr-5" : ""}`}
                >
                  <p
                    className={`text-sm ${
                      !notification.isRead ? "font-medium" : "text-foreground"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(notification.createdAt as string)}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Notification detail modal */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedNotification?.createdAt
                ? formatRelativeTime(selectedNotification.createdAt as string)
                : ""}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {selectedNotification?.body}
          </p>

          <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            {entityUrl && (
              <Button
                size="sm"
                className="gap-1"
                onClick={handleNavigateToEntity}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {selectedNotification?.entityType === "task"
                  ? "فتح المهمة"
                  : "فتح المشروع"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedNotification(null)}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
