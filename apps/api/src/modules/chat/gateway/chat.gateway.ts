import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
import { WsAuthGuard } from "../../../common/guards/ws-auth.guard";
import { ChatService } from "../services/chat.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ChatPresenceService } from "../services/chat-presence.service";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  },
})
@UseGuards(WsAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private eventEmitter: EventEmitter2,
    private presenceService: ChatPresenceService,
    private jwtService: JwtService,
  ) {
    this.eventEmitter.on("chat.messageCreated", (payload) => {
      this.server
        .to(`conversation:${payload.conversationId}`)
        .emit("newMessage", payload.message);
    });

    this.eventEmitter.on("chat.messageUpdated", (payload) => {
      this.server
        .to(`conversation:${payload.conversationId}`)
        .emit("messageUpdated", payload.message);
    });

    this.eventEmitter.on("chat.messageDeleted", (payload) => {
      this.server
        .to(`conversation:${payload.conversationId}`)
        .emit("messageDeleted", payload.message);
    });
  }

  async handleConnection(client: Socket) {
    let user = client.data.user;
    if (!user) {
      const token = client.handshake.auth?.token ?? client.handshake.headers.cookie?.match(/(?:^|;\s*)token=([^;]+)/)?.[1];
      if (!token) { client.disconnect(true); return; }
      try {
        user = this.jwtService.verify(decodeURIComponent(token));
        client.data.user = user;
      } catch {
        client.disconnect(true);
        return;
      }
    }

    const userId = user.sub || user.id;
    this.logger.log(`Chat WS connected: userId=${userId}`);
    const becameOnline = await this.presenceService.connect(userId, client.id);

    const conversations = await this.chatService.getUserConversationIds(
      userId,
    );
    for (const convId of conversations) {
      client.join(`conversation:${convId}`);
    }

    client.join(`user:${userId}`);
    if (becameOnline) {
      for (const convId of conversations) this.server.to(`conversation:${convId}`).emit("userOnline", { userId });
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;
    const userId = user.sub || user.id;
    const lastSeenAt = await this.presenceService.disconnect(userId, client.id);
    this.logger.log(`Chat WS disconnected: ${client.id}`);
    if (lastSeenAt) {
      const conversations = await this.chatService.getUserConversationIds(userId);
      for (const convId of conversations) this.server.to(`conversation:${convId}`).emit("userOffline", { userId, lastSeenAt: lastSeenAt.toISOString() });
    }
  }

  @SubscribeMessage("presenceHeartbeat")
  handlePresenceHeartbeat(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    return this.presenceService.heartbeat(user.sub || user.id, client.id);
  }

  @SubscribeMessage("joinConversation")
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.assertConversationAccess(
      data.conversationId,
      client.data.user.sub || client.data.user.id,
    );
    client.join(`conversation:${data.conversationId}`);
    return { event: "joined", conversationId: data.conversationId };
  }

  @SubscribeMessage("leaveConversation")
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.assertConversationAccess(
      data.conversationId,
      client.data.user.sub || client.data.user.id,
    );
    client.leave(`conversation:${data.conversationId}`);
    return { event: "left", conversationId: data.conversationId };
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody()
    data: { conversationId: string; content: string; parentMessageId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    return this.chatService.createMessage(user.sub || user.id, {
      conversationId: data.conversationId,
      content: data.content,
      parentMessageId: data.parentMessageId,
    });
  }

  @SubscribeMessage("typing")
  async handleTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    await this.chatService.assertConversationAccess(data.conversationId, user.sub || user.id);
    client.to(`conversation:${data.conversationId}`).emit("userTyping", {
      conversationId: data.conversationId,
      userId: user.sub || user.id,
      userName: user.name,
    });
  }

  @SubscribeMessage("stopTyping")
  async handleStopTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    await this.chatService.assertConversationAccess(data.conversationId, user.sub || user.id);
    client.to(`conversation:${data.conversationId}`).emit("userStopTyping", {
      conversationId: data.conversationId,
      userId: user.sub || user.id,
    });
  }
}
