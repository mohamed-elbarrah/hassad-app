import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "../../../common/guards/ws-auth.guard";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";

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

  constructor(
    private eventEmitter: EventEmitter2,
    private jwtService: JwtService,
  ) {
    this.eventEmitter.on("notification.created", (payload) => {
      const { userId, ...rest } = payload;
      this.server.to(`user:${userId}`).emit("notification", rest);
    });

    this.eventEmitter.on("notification.unreadCount", (payload) => {
      const { userId, count } = payload;
      this.server.to(`user:${userId}`).emit("unreadCount", { count });
    });

    this.eventEmitter.on("notification.broadcast", (payload) => {
      for (const userId of payload.userIds ?? []) {
        this.server.to(`user:${userId}`).emit("broadcast", {
          title: payload.title,
          message: payload.message,
        });
      }
    });
  }

  async handleConnection(client: Socket) {
    let user = client.data.user;
    if (!user) {
      const token = client.handshake.auth?.token ?? client.handshake.headers.cookie?.match(/(?:^|;\s*)token=([^;]+)/)?.[1];
      if (!token) {
        client.disconnect(true);
        return;
      }
      try {
        user = this.jwtService.verify(decodeURIComponent(token));
        client.data.user = user;
      } catch {
        client.disconnect(true);
        return;
      }
    }

    const userId = user.sub || user.id;
    this.logger.log(`Notification WS connected: userId=${userId}`);
    client.join(`user:${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification WS disconnected: ${client.id}`);
  }
}
