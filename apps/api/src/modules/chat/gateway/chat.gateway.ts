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
    const user = client.data.user;
    if (!user) {
      client.disconnect(true);
      return;
    }

    this.logger.log(`Chat WS connected: userId=${user.sub || user.id}`);

    const conversations = await this.chatService.getUserConversationIds(
      user.sub || user.id,
    );
    for (const convId of conversations) {
      client.join(`conversation:${convId}`);
    }

    client.join(`user:${user.sub || user.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat WS disconnected: ${client.id}`);
  }

  @SubscribeMessage("joinConversation")
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { event: "joined", conversationId: data.conversationId };
  }

  @SubscribeMessage("leaveConversation")
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
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
    client.to(`conversation:${data.conversationId}`).emit("userStopTyping", {
      conversationId: data.conversationId,
      userId: user.sub || user.id,
    });
  }
}
