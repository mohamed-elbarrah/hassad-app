"use client";

import { useEffect, useCallback } from "react";
import type { NotificationEventPayload } from "@hassad/shared";
import { useSocket } from "./useSocket";

type BroadcastSocketPayload = {
  eventType: "BROADCAST";
  metadata: Record<string, unknown> | null;
};

export function useNotifications() {
  const { socket, isConnected, shouldPoll } = useSocket();

  const onNotification = useCallback(
    (handler: (notification: NotificationEventPayload) => void) => {
      socket?.on("notification", handler);
      return () => {
        socket?.off("notification", handler);
      };
    },
    [socket],
  );

  const onUnreadCount = useCallback(
    (handler: (data: { count: number }) => void) => {
      socket?.on("unreadCount", handler);
      return () => {
        socket?.off("unreadCount", handler);
      };
    },
    [socket],
  );

  const onBroadcast = useCallback(
    (handler: (data: BroadcastSocketPayload) => void) => {
      socket?.on("broadcast", handler);
      return () => {
        socket?.off("broadcast", handler);
      };
    },
    [socket],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("connect_error", () => {
      // Will fallback to polling via RTK Query if shouldPoll is true
    });
  }, [socket]);

  return {
    isConnected,
    shouldPoll,
    onNotification,
    onUnreadCount,
    onBroadcast,
  };
}
