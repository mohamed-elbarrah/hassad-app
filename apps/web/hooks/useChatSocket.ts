"use client";

import { useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";
import type {
  ChatUnreadCountEvent,
  Message,
} from "@/features/chat/chatApi";

export function useChatSocket(conversationId?: string) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const heartbeat = () => {
      if (socket.connected) socket.emit("presenceHeartbeat");
    };
    socket.on("connect", heartbeat);
    heartbeat();
    const heartbeatTimer = window.setInterval(heartbeat, 30_000);

    return () => {
      window.clearInterval(heartbeatTimer);
      socket.off("connect", heartbeat);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("joinConversation", { conversationId });

    return () => {
      socket.emit("leaveConversation", { conversationId });
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(
    (convId: string, content: string) => {
      socket?.emit("sendMessage", { conversationId: convId, content });
    },
    [socket],
  );

  const emitTyping = useCallback(
    (convId: string) => {
      socket?.emit("typing", { conversationId: convId });
    },
    [socket],
  );

  const emitStopTyping = useCallback(
    (convId: string) => {
      socket?.emit("stopTyping", { conversationId: convId });
    },
    [socket],
  );

  const markConversationRead = useCallback(
    (convId: string): Promise<void> =>
      new Promise((resolve, reject) => {
        if (!socket?.connected) {
          reject({ code: "SOCKET_NOT_CONNECTED", details: {} });
          return;
        }

        socket.timeout(5_000).emit(
          "markConversationRead",
          { conversationId: convId },
          (timeoutError: unknown, response: unknown) => {
            if (timeoutError) {
              reject({ code: "SOCKET_ACK_TIMEOUT", details: {} });
              return;
            }
            if (
              !response ||
              typeof response !== "object" ||
              (response as { acknowledged?: unknown }).acknowledged !== true ||
              (response as { code?: unknown }).code !== "CONVERSATION_READ" ||
              !((response as { data?: unknown }).data &&
                typeof (response as { data: { conversationId?: unknown } }).data.conversationId === "string" &&
                (response as { data: { conversationId: string } }).data.conversationId === convId)
            ) {
              reject({ code: "CHAT_OPERATION_FAILED", details: {} });
              return;
            }
            resolve();
          },
        );
      }),
    [socket],
  );

  const onUnreadCount = useCallback(
    (handler: (data: ChatUnreadCountEvent) => void) => {
      if (!socket) return undefined;
      const scopedHandler = (data: unknown) => {
        if (
          !data ||
          typeof data !== "object" ||
          typeof (data as { conversationId?: unknown }).conversationId !== "string" ||
          typeof (data as { unreadCount?: unknown }).unreadCount !== "number" ||
          !Number.isFinite((data as { unreadCount: number }).unreadCount) ||
          !Number.isInteger((data as { unreadCount: number }).unreadCount) ||
          (data as { unreadCount: number }).unreadCount < 0
        ) return;
        handler(data as ChatUnreadCountEvent);
      };
      socket.on("chatUnreadCount", scopedHandler);
      return () => {
        socket.off("chatUnreadCount", scopedHandler);
      };
    },
    [socket],
  );

  const onNewMessage = useCallback(
    (handler: (message: Message) => void) => {
      if (!socket) return undefined;
      const scopedHandler = (message: Message) => handler(message);
      socket.on("newMessage", scopedHandler);
      return () => {
        socket.off("newMessage", scopedHandler);
      };
    },
    [socket],
  );

  const onMessageUpdated = useCallback(
    (handler: (message: Message) => void) => {
      if (!socket) return undefined;
      const scopedHandler = (message: Message) => handler(message);
      socket.on("messageUpdated", scopedHandler);
      return () => {
        socket.off("messageUpdated", scopedHandler);
      };
    },
    [socket],
  );

  const onMessageDeleted = useCallback(
    (handler: (message: Message) => void) => {
      if (!socket) return undefined;
      const scopedHandler = (message: Message) => handler(message);
      socket.on("messageDeleted", scopedHandler);
      return () => {
        socket.off("messageDeleted", scopedHandler);
      };
    },
    [socket],
  );

  const onUserTyping = useCallback(
    (
      handler: (data: {
        conversationId: string;
        userId: string;
        userName: string;
      }) => void,
    ) => {
      if (!socket) return undefined;
      const scopedHandler = (data: {
        conversationId: string;
        userId: string;
        userName: string;
      }) => {
        if (data.conversationId === conversationId) handler(data);
      };
      socket.on("userTyping", scopedHandler);
      return () => {
        socket.off("userTyping", scopedHandler);
      };
    },
    [conversationId, socket],
  );

  const onPresenceChange = useCallback(
    (handler: (data: { userId: string; isOnline: boolean; lastSeenAt?: string }) => void) => {
      if (!socket) return undefined;
      const handleOnline = (data: unknown) => {
        if (
          !data ||
          typeof data !== "object" ||
          typeof (data as { userId?: unknown }).userId !== "string"
        )
          return;
        handler({ userId: (data as { userId: string }).userId, isOnline: true });
      };
      const handleOffline = (data: unknown) => {
        if (
          !data ||
          typeof data !== "object" ||
          typeof (data as { userId?: unknown }).userId !== "string" ||
          typeof (data as { lastSeenAt?: unknown }).lastSeenAt !== "string"
        )
          return;
        const offline = data as { userId: string; lastSeenAt: string };
        handler({ ...offline, isOnline: false });
      };
      socket.on("userOnline", handleOnline);
      socket.on("userOffline", handleOffline);
      return () => {
        socket.off("userOnline", handleOnline);
        socket.off("userOffline", handleOffline);
      };
    },
    [socket],
  );

  const onUserStopTyping = useCallback(
    (handler: (data: { conversationId: string; userId: string }) => void) => {
      if (!socket) return undefined;
      const scopedHandler = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === conversationId) handler(data);
      };
      socket.on("userStopTyping", scopedHandler);
      return () => {
        socket.off("userStopTyping", scopedHandler);
      };
    },
    [conversationId, socket],
  );

  return {
    isConnected,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markConversationRead,
    onUnreadCount,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onUserTyping,
    onUserStopTyping,
    onPresenceChange,
  };
}
