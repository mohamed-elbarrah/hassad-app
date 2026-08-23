"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/features/notifications/notificationsApi";
import type { NotificationItem } from "@/features/notifications/notificationsApi";
import { useAppSelector } from "@/lib/hooks";
import { formatRelativeTime } from "@/lib/format";
import { resolveEntityUrl } from "@/components/common/NotificationsDropdown";

const PAGE_SIZE = 20;

type NotificationFilter = "all" | "unread";

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetMyNotificationsQuery({
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
    if (!notification.isRead) await markAsRead(notification.id);
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6" dir="rtl">
      <Card className="overflow-hidden">
        <CardHeader className="gap-5 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">الإشعارات</CardTitle>
                <CardDescription>
                  {data?.unreadCount
                    ? `${data.unreadCount} إشعار غير مقروء`
                    : "أنت على اطلاع بكل جديد"}
                </CardDescription>
              </div>
            </div>
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 self-start"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck aria-hidden="true" data-icon="inline-start" />
                تعليم الكل كمقروء
              </Button>
            )}
          </div>
          <ToggleGroup
            type="single"
            value={filter}
            variant="outline"
            size="sm"
            aria-label="تصفية الإشعارات"
            onValueChange={(value) => {
              if (!value) return;
              setFilter(value as NotificationFilter);
              setPage(1);
            }}
          >
            <ToggleGroupItem value="all">الكل</ToggleGroupItem>
            <ToggleGroupItem value="unread">غير المقروءة</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>

        <CardContent className="p-0">
          {isError ? (
            <Alert variant="destructive" className="m-5 w-auto">
              <AlertTitle>تعذر تحميل الإشعارات</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                حدث خطأ أثناء تحميل الإشعارات. حاول مرة أخرى.
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => refetch()}
                >
                  إعادة المحاولة
                </Button>
              </AlertDescription>
            </Alert>
          ) : isLoading || isFetching ? (
            <div className="flex flex-col divide-y">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2 p-5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Empty className="min-h-72 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bell aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>
                  {filter === "unread"
                    ? "لا توجد إشعارات غير مقروءة"
                    : "لا توجد إشعارات"}
                </EmptyTitle>
                <EmptyDescription>
                  ستظهر الإشعارات الجديدة هنا عند وصولها.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className="group flex w-full items-start gap-3 p-5 text-right transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  data-unread={!notification.isRead || undefined}
                  onClick={() => handleClickNotification(notification)}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-2 size-2 shrink-0 rounded-full ${
                      notification.isRead ? "bg-transparent" : "bg-primary"
                    }`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      className={`truncate text-sm ${
                        notification.isRead
                          ? "font-normal text-foreground"
                          : "font-semibold text-foreground"
                      }`}
                    >
                      {notification.title}
                    </span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">
                      {notification.body}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt as string)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination dir="rtl">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                direction="rtl"
                text="السابق"
                disabled={page === 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-muted-foreground">
                صفحة {page} من {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                direction="rtl"
                text="التالي"
                disabled={page === totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent
          className="max-w-md"
          dir="rtl"
          closeLabel="إغلاق نافذة الإشعار"
        >
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              {selectedNotification?.createdAt
                ? formatRelativeTime(selectedNotification.createdAt as string)
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto rounded-md bg-muted/50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {selectedNotification?.body}
            </p>
          </div>
          <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            {entityUrl && (
              <Button size="sm" onClick={handleNavigateToEntity}>
                <ExternalLink aria-hidden="true" data-icon="inline-start" />
                {selectedNotification?.entityType === "task"
                  ? "فتح المهمة"
                  : "فتح المشروع"}
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                إغلاق
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
