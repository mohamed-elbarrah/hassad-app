"use client";

import { useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";

export function useChatSocket(conversationId?: string) {
  const { socket, isConnected } = useSocket();

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

  const onNewMessage = useCallback(
    (handler: (message: any) => void) => {
      socket?.on("newMessage", handler);
      return () => {
        socket?.off("newMessage", handler);
      };
    },
    [socket],
  );

  const onUserTyping = useCallback(
    (handler: (data: { conversationId: string; userId: string; userName: string }) => void) => {
      socket?.on("userTyping", handler);
      return () => {
        socket?.off("userTyping", handler);
      };
    },
    [socket],
  );

  const onUserStopTyping = useCallback(
    (handler: (data: { conversationId: string; userId: string }) => void) => {
      socket?.on("userStopTyping", handler);
      return () => {
        socket?.off("userStopTyping", handler);
      };
    },
    [socket],
  );

  return {
    isConnected,
    sendMessage,
    emitTyping,
    emitStopTyping,
    onNewMessage,
    onUserTyping,
    onUserStopTyping,
  };
}