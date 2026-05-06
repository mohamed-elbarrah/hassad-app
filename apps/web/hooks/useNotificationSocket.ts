"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { portalNotificationsApi } from "@/features/portal-notifications/portalNotificationsApi";
import { getApiBaseUrl } from "@/lib/utils";

export function useNotificationSocket() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io(getApiBaseUrl(), {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Connected - server joins user:<id> from JWT auth
    });

    socket.on("notification", () => {
      dispatch(portalNotificationsApi.util.invalidateTags(["PortalNotification"]));
    });

    socket.on("unreadCount", (payload: { count: number }) => {
      dispatch(
        portalNotificationsApi.util.updateQueryData(
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
    };
  }, [isAuthenticated, dispatch]);
}
