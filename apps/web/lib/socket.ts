import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketConsumers = 0;

export function getSocket(): Socket {
  socketConsumers += 1;
  if (socket) return socket;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";
  const wsUrl = apiUrl.replace(/\/v1$/, "");

  // Authentication is carried by the secure HttpOnly cookie. Reading the
  // cookie here would both fail for HttpOnly cookies and expose credentials to
  // the client bundle, so let Socket.IO include it with the handshake.
  socket = io(wsUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  return socket;
}

export function disconnectSocket() {
  socketConsumers = Math.max(0, socketConsumers - 1);
  if (socket && socketConsumers === 0) {
    socket.disconnect();
    socket = null;
  }
}
