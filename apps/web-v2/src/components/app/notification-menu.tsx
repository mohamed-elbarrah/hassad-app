"use client";

import { useEffect } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { BellIcon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  notificationsApi,
  useGetNotificationUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from "@/lib/api/notifications-api";
import { useAppDispatch } from "@/lib/store";
import type { NotificationRecord } from "@/lib/api/notifications-api";

function apiSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
  return apiUrl.endsWith("/v1") ? apiUrl.slice(0, -3) : apiUrl;
}

function notificationHref(notification: NotificationRecord, workspaceKey: string) {
  const type = notification.entityType.toLowerCase();
  const prefix = workspaceKey === "pm" ? "/pm" : workspaceKey === "team" ? "/team" : workspaceKey === "marketing" ? "/marketing" : workspaceKey === "sales" ? "/crm" : "/admin";
  if (type.includes("task")) return `${prefix}/tasks/${notification.entityId}`;
  if (type.includes("project")) return `${prefix}/projects/${notification.entityId}`;
  if (type.includes("campaign")) return `/marketing/campaigns/${notification.entityId}`;
  if (type.includes("strategy")) return `/marketing/strategies/${notification.entityId}`;
  if (type.includes("client")) return `${prefix}/clients/${notification.entityId}`;
  if (type.includes("dispute")) return `${prefix}/disputes/${notification.entityId}`;
  if (type.includes("chat") || type.includes("message")) return "/admin/chat";
  return "/notifications";
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : formatDistanceToNowStrict(date, { addSuffix: true });
}

export function NotificationMenu({ workspaceKey, workspaceLabel }: { workspaceKey: string; workspaceLabel: string }) {
  const dispatch = useAppDispatch();
  const queryArg = { page: 1, limit: 10 };
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(queryArg);
  const { data: unreadData } = useGetNotificationUnreadCountQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const unreadCount = unreadData?.count ?? data?.unreadCount ?? 0;

  useEffect(() => {
    const socket = io(apiSocketUrl(), { withCredentials: true, transports: ["websocket"] });

    socket.on("notification", (notification: NotificationRecord) => {
      dispatch(
        notificationsApi.util.updateQueryData("getNotifications", queryArg, (current) => {
          current.data = [notification, ...current.data.filter((item) => item.id !== notification.id)].slice(0, 10);
          current.total += 1;
          current.unreadCount += notification.isRead ? 0 : 1;
        }),
      );
      dispatch(
        notificationsApi.util.updateQueryData("getNotificationUnreadCount", undefined, (current) => {
          current.count += notification.isRead ? 0 : 1;
        }),
      );
    });

    socket.on("unreadCount", ({ count }: { count: number }) => {
      dispatch(
        notificationsApi.util.updateQueryData("getNotificationUnreadCount", undefined, (current) => {
          current.count = count;
        }),
      );
    });

    socket.on("broadcast", refetch);
    return () => {
      socket.disconnect();
    };
  }, [dispatch, refetch]);

  function handleOpen(notification: NotificationRecord) {
    if (!notification.isRead) void markRead(notification.id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" className="relative" />}>
        <BellIcon />
        {unreadCount > 0 ? (
          <Badge className="absolute -right-1 -top-1 min-w-5 justify-center px-1 text-[0.65rem]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        ) : null}
        <span className="sr-only">Open notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-foreground">Notifications</span>
            <span className="block font-normal">Latest {workspaceLabel} activity</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isLoading ? (
            <div className="flex flex-col gap-3 p-3">
              {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
            </div>
          ) : isError ? (
            <Empty className="border-0 p-4">
              <EmptyHeader>
                <EmptyTitle>Notifications unavailable</EmptyTitle>
                <EmptyDescription>Try again in a moment.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : data?.data.length ? (
            data.data.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                render={<Link href={notificationHref(notification, workspaceKey)} />}
                onClick={() => handleOpen(notification)}
                className={notification.isRead ? undefined : "bg-accent/50"}
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-medium">{notification.title}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</span>
                  <span className="text-xs text-muted-foreground">{formatNotificationTime(notification.sentAt ?? notification.createdAt)}</span>
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <Empty className="border-0 p-4">
              <EmptyHeader>
                <EmptyTitle>No notifications</EmptyTitle>
                <EmptyDescription>You are up to date.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/notifications" />} className="justify-center font-medium">
          See more
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
