import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "../../../common/guards/ws-auth.guard";
import { EventEmitter2 } from "@nestjs/event-emitter";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  },
})
@UseGuards(WsAuthGuard)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private eventEmitter: EventEmitter2) {
    this.eventEmitter.on("notification.created", (payload) => {
      const { userId, ...rest } = payload;
      this.server.to(`user:${userId}`).emit("notification", rest);
    });

    this.eventEmitter.on("notification.unreadCount", (payload) => {
      const { userId, count } = payload;
      this.server.to(`user:${userId}`).emit("unreadCount", { count });
    });

    this.eventEmitter.on("notification.broadcast", (payload) => {
      this.server.emit("broadcast", payload);
    });
  }

  async handleConnection(client: Socket) {
    const user = client.data.user;
    if (!user) {
      client.disconnect(true);
      return;
    }

    const userId = user.sub || user.id;
    this.logger.log(`Notification WS connected: userId=${userId}`);
    client.join(`user:${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification WS disconnected: ${client.id}`);
  }
}