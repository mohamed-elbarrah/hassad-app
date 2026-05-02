import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket?.connected) return socket;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";
  const wsUrl = apiUrl.replace(/\/v1$/, "");

  const token =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1]
      : undefined;

  socket = io(wsUrl, {
    auth: { token: token ? decodeURIComponent(token) : undefined },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}