"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("reconnect_attempt", () => {
      setReconnectCount((c) => c + 1);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("reconnect_attempt");
      disconnectSocket();
    };
  }, []);

  const shouldPoll = reconnectCount > 3;

  return { socket: socketRef.current, isConnected, shouldPoll };
}