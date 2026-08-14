"use client";

import { useState } from "react";
import Link from "next/link";
import { BellIcon, CheckCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/lib/api/notifications-api";
import type { NotificationRecord } from "@/lib/api/notifications-api";
import { cn } from "@/lib/utils";

function notificationHref(notification: NotificationRecord) {
  const type = notification.entityType.toLowerCase();
  if (type.includes("task")) return `/admin/tasks/${notification.entityId}`;
  if (type.includes("project")) return `/admin/projects/${notification.entityId}`;
  if (type.includes("campaign")) return `/marketing/campaigns/${notification.entityId}`;
  if (type.includes("strategy")) return `/marketing/strategies/${notification.entityId}`;
  if (type.includes("client")) return `/admin/clients/${notification.entityId}`;
  if (type.includes("dispute")) return `/admin/disputes/${notification.entityId}`;
  if (type.includes("chat") || type.includes("message")) return "/admin/chat";
  return "/notifications";
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationsPageClient() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetNotificationsQuery({ page, limit: 20 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 20)));

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Your notifications across the workspaces you can access.</p>
        </div>
        <Button variant="outline" disabled={isMarkingAll || !data?.unreadCount} onClick={() => void markAllRead()}>
          <CheckCheckIcon data-icon="inline-start" />
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent activity
            {data?.unreadCount ? <Badge variant="secondary">{data.unreadCount} unread</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}
            </div>
          ) : isError ? (
            <Empty className="border-0 p-10">
              <EmptyHeader>
                <EmptyMedia variant="icon"><BellIcon /></EmptyMedia>
                <EmptyTitle>Notifications unavailable</EmptyTitle>
                <EmptyDescription>We could not load your notifications. Try again shortly.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : data?.data.length ? (
            <div className="flex flex-col">
              {data.data.map((notification) => (
                <Link
                  key={notification.id}
                  href={notificationHref(notification)}
                  onClick={() => { if (!notification.isRead) void markRead(notification.id); }}
                  className="flex gap-4 border-t p-4 first:border-t-0 hover:bg-muted/50"
                >
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", notification.isRead ? "bg-muted" : "bg-primary")} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-sm text-muted-foreground">{notification.body}</span>
                    <span className="text-xs text-muted-foreground">{timeLabel(notification.sentAt ?? notification.createdAt)}</span>
                  </span>
                  {!notification.isRead ? <Badge variant="outline">Unread</Badge> : null}
                </Link>
              ))}
            </div>
          ) : (
            <Empty className="border-0 p-10">
              <EmptyHeader>
                <EmptyMedia variant="icon"><BellIcon /></EmptyMedia>
                <EmptyTitle>You are all caught up</EmptyTitle>
                <EmptyDescription>New activity will appear here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      ) : null}
    </main>
  );
}
