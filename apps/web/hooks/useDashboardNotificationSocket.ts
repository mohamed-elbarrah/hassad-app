"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { notificationsApi } from "@/features/notifications/notificationsApi";
import { getApiBaseUrl } from "@/lib/utils";

export function useDashboardNotificationSocket() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(getApiBaseUrl(), {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
      setReconnectAttempts(0);
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    socket.on("reconnect_attempt", () => {
      setReconnectAttempts((prev) => prev + 1);
    });

    socket.on("connect_error", () => {
      setIsSocketConnected(false);
    });

    socket.on("notification", () => {
      dispatch(notificationsApi.util.invalidateTags(["Notification"]));
    });

    socket.on("broadcast", () => {
      dispatch(notificationsApi.util.invalidateTags(["Notification"]));
    });

    socket.on("unreadCount", (payload: { count: number }) => {
      dispatch(
        notificationsApi.util.updateQueryData(
          "getUnreadCount",
          undefined,
          (draft) => {
            draft.count = payload.count;
          },
        ),
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
      setReconnectAttempts(0);
    };
  }, [isAuthenticated, dispatch]);

  // Only poll if socket has failed to connect multiple times
  const shouldPoll = reconnectAttempts >= 3 && !isSocketConnected;

  return { isSocketConnected, shouldPoll };
}
