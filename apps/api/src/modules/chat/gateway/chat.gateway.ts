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
import {
  HttpException,
  Logger,
  UseGuards,
  UsePipes,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { WsAuthGuard } from "../../../common/guards/ws-auth.guard";
import { ChatService } from "../services/chat.service";
import {
  ChatConversationSocketDto,
  ChatSendMessageSocketDto,
} from "../dto/chat.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ChatPresenceService } from "../services/chat-presence.service";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  },
})
@UseGuards(WsAuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new WsException({
        code: "VALIDATION_ERROR",
        details: {
          fields: Object.fromEntries(
            errors.map((error) => [error.property, { code: "INVALID_VALUE" }]),
          ),
        },
      }),
  }),
)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private eventEmitter: EventEmitter2,
    private presenceService: ChatPresenceService,
    private wsAuthGuard: WsAuthGuard,
  ) {
    this.eventEmitter.on("chat.messageCreated", (payload) => {
      void this.broadcastToAuthorizedParticipants(
        payload.conversationId,
        "newMessage",
        payload.message,
      ).catch((error) =>
        this.logger.warn(`Chat broadcast failed: ${String(error)}`),
      );
    });

    this.eventEmitter.on(
      "chat.unreadCountChanged",
      (payload: { conversationId: string }) => {
        void this.broadcastUnreadCounts(payload.conversationId).catch((error) =>
          this.logger.warn(
            `Chat unread count broadcast failed: ${String(error)}`,
          ),
        );
      },
    );

    this.eventEmitter.on("chat.messageUpdated", (payload) => {
      void this.broadcastToAuthorizedParticipants(
        payload.conversationId,
        "messageUpdated",
        payload.message,
      ).catch((error) =>
        this.logger.warn(`Chat broadcast failed: ${String(error)}`),
      );
    });

    this.eventEmitter.on("chat.messageDeleted", (payload) => {
      void this.broadcastToAuthorizedParticipants(
        payload.conversationId,
        "messageDeleted",
        payload.message,
      ).catch((error) =>
        this.logger.warn(`Chat broadcast failed: ${String(error)}`),
      );
    });

    this.eventEmitter.on("chat.participantRemoved", (payload) => {
      void this.removeParticipantSocketsFromRoom(
        payload.conversationId,
        payload.userId,
      ).catch((error) =>
        this.logger.warn(`Chat room cleanup failed: ${String(error)}`),
      );
    });
  }

  async handleConnection(client: Socket) {
    let user = client.data.user;
    if (!user) {
      const token = client.handshake.headers.cookie?.match(
        /(?:^|;\s*)token=([^;]+)/,
      )?.[1];
      if (!token) {
        client.disconnect(true);
        return;
      }
      try {
        user = await this.wsAuthGuard.validateToken(decodeURIComponent(token));
        const userId = user.sub || user.id;
        if (!userId) throw new Error("Invalid socket identity");
        client.data.user = user;
      } catch {
        client.disconnect(true);
        return;
      }
    }

    const userId = user.sub || user.id;
    if (!userId) {
      client.disconnect(true);
      return;
    }
    this.logger.log(`Chat WS connected: userId=${userId}`);
    const becameOnline = await this.presenceService.connect(userId, client.id);

    // A valid session is not sufficient for chat visibility. Do not join any
    // conversation or user room unless the permission is current; both rooms
    // can carry chat data (including unread counts).
    const canRead = await this.wsAuthGuard.hasPermission(userId, "chat.read");
    const canMessage = await this.wsAuthGuard.hasPermission(
      userId,
      "chat.message",
    );
    if (!canRead && !canMessage) {
      client.disconnect(true);
      return;
    }
    const conversations = canRead
      ? await this.chatService.getUserConversationIds(userId)
      : [];
    for (const convId of conversations) {
      client.join(`conversation:${convId}`);
    }

    if (canRead) client.join(`user:${userId}`);
    if (becameOnline) {
      await Promise.all(
        conversations.map((conversationId) =>
          this.broadcastToAuthorizedParticipants(conversationId, "userOnline", {
            userId,
          }),
        ),
      );
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;
    const userId = user.sub || user.id;
    const lastSeenAt = await this.presenceService.disconnect(userId, client.id);
    this.logger.log(`Chat WS disconnected: ${client.id}`);
    if (lastSeenAt) {
      const conversations =
        await this.chatService.getUserConversationIds(userId);
      await Promise.all(
        conversations.map((conversationId) =>
          this.broadcastToAuthorizedParticipants(
            conversationId,
            "userOffline",
            {
              userId,
              lastSeenAt: lastSeenAt.toISOString(),
            },
          ),
        ),
      );
    }
  }

  @SubscribeMessage("presenceHeartbeat")
  async handlePresenceHeartbeat(@ConnectedSocket() client: Socket) {
    return this.withWsErrors(async () => {
      await this.assertSocketSession(client);
      const userId = this.userId(client);
      const canRead = await this.wsAuthGuard.hasPermission(userId, "chat.read");
      const canMessage = await this.wsAuthGuard.hasPermission(
        userId,
        "chat.message",
      );
      if (!canRead && !canMessage) {
        client.disconnect(true);
        throw new WsException({ code: "PERMISSION_DENIED", details: {} });
      }
      const acknowledged = await this.presenceService.heartbeat(
        userId,
        client.id,
      );

      // A heartbeat from an unauthenticated, stale, or already-disconnected
      // socket must not silently succeed or refresh another presence record.
      if (!acknowledged) {
        throw new WsException({
          code: "PRESENCE_HEARTBEAT_INVALID",
          details: {},
        });
      }

      return { event: "presenceHeartbeat", acknowledged: true };
    });
  }

  @SubscribeMessage("joinConversation")
  async handleJoinConversation(
    @MessageBody() data: ChatConversationSocketDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.withWsErrors(async () => {
      await this.assertSocketSession(client);
      const userId = this.userId(client);
      await this.wsAuthGuard.assertPermission(userId, "chat.read");
      await this.chatService.assertConversationAccess(
        data.conversationId,
        userId,
      );
      client.join(`conversation:${data.conversationId}`);
      return { event: "joined", conversationId: data.conversationId };
    });
  }

  @SubscribeMessage("leaveConversation")
  async handleLeaveConversation(
    @MessageBody() data: ChatConversationSocketDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.withWsErrors(async () => {
      // Leaving is intentionally idempotent: removed participants and sockets
      // in deactivated conversations must be able to clean up stale rooms.
      await this.assertSocketSession(client);
      this.userId(client);
      client.leave(`conversation:${data.conversationId}`);
      return { event: "left", conversationId: data.conversationId };
    });
  }

  @SubscribeMessage("markConversationRead")
  async handleMarkConversationRead(
    @MessageBody() data: ChatConversationSocketDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      return await this.withWsErrors(async () => {
        await this.assertSocketSession(client);
        const userId = this.userId(client);
        await this.wsAuthGuard.assertPermission(userId, "chat.read");
        const result = await this.chatService.markConversationRead(
          data.conversationId,
          userId,
        );

        // Socket.IO uses the handler return value as the acknowledgement
        // payload. Keep it explicit and code-based like the REST contract.
        return {
          event: "conversationRead",
          code: "CONVERSATION_READ",
          acknowledged: true,
          data: result,
        };
      });
    } catch (error) {
      // Return operation failures through the Socket.IO acknowledgement instead
      // of relying on a transport-level exception event that clients cannot
      // correlate with this request.
      const response = error instanceof WsException ? error.getError() : null;
      const body =
        typeof response === "object" && response !== null
          ? (response as { code?: string; details?: unknown })
          : undefined;
      return {
        event: "conversationRead",
        acknowledged: false,
        code: body?.code ?? "CHAT_OPERATION_FAILED",
        details: body?.details ?? {},
      };
    }
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody() data: ChatSendMessageSocketDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.withWsErrors(async () => {
      await this.assertSocketSession(client);
      const userId = this.userId(client);
      await this.wsAuthGuard.assertPermission(userId, "chat.message");
      // Keep these checks at the websocket boundary, rather than relying only
      // on the service, so socket sends match the REST authorization policy.
      await this.chatService.assertConversationAccess(
        data.conversationId,
        userId,
      );
      return this.chatService.createMessage(userId, {
        conversationId: data.conversationId,
        content: data.content,
        parentMessageId: data.parentMessageId,
      });
    });
  }

  @SubscribeMessage("typing")
  async handleTyping(
    @MessageBody() data: ChatConversationSocketDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.withWsErrors(async () => {
      await this.assertSocketSession(client);
      const user = client.data.user;
      const userId = this.userId(client);
      await this.wsAuthGuard.assertPermission(userId, "chat.message");
      await this.chatService.assertConversationAccess(
        data.conversationId,
        userId,
      );
      await this.broadcastToAuthorizedParticipants(
        data.conversationId,
        "userTyping",
        {
          conversationId: data.conversationId,
          userId: this.userId(client),
          userName: user.name,
        },
        client.id,
      );
    });
  }

  @SubscribeMessage("stopTyping")
  async handleStopTyping(
    @MessageBody() data: ChatConversationSocketDto,
    @ConnectedSocket() client: Socket,
  ) {
    return this.withWsErrors(async () => {
      await this.assertSocketSession(client);
      const userId = this.userId(client);
      await this.wsAuthGuard.assertPermission(userId, "chat.message");
      await this.chatService.assertConversationAccess(
        data.conversationId,
        userId,
      );
      await this.broadcastToAuthorizedParticipants(
        data.conversationId,
        "userStopTyping",
        {
          conversationId: data.conversationId,
          userId: this.userId(client),
        },
        client.id,
      );
    });
  }

  private async assertSocketSession(client: Socket): Promise<void> {
    try {
      await this.wsAuthGuard.validateSession(client.data?.user);
    } catch (error) {
      // Revocation and account suspension must terminate an established socket,
      // not merely reject its next operation.
      client.disconnect(true);
      throw error;
    }
  }

  private userId(client: Socket): string {
    const user = client.data?.user;
    const userId = user?.sub ?? user?.id;
    if (typeof userId !== "string" || userId.length === 0) {
      throw new WsException({ code: "UNAUTHENTICATED", details: {} });
    }
    return userId;
  }

  /**
   * Room membership is stateful, while participant membership can change in
   * the database. Re-check both conversation and user activity before every
   * server-originated broadcast and evict stale sockets as we encounter them.
   */
  private async broadcastToAuthorizedParticipants(
    conversationId: string,
    event: string,
    payload: unknown,
    excludeSocketId?: string,
  ) {
    const room = `conversation:${conversationId}`;
    const participantIds =
      await this.chatService.getActiveConversationParticipantIds(
        conversationId,
      );
    const sockets = await this.server.in(room).fetchSockets();

    for (const socket of sockets) {
      const socketUserId = socket.data?.user?.sub ?? socket.data?.user?.id;
      if (typeof socketUserId !== "string") {
        socket.disconnect(true);
        continue;
      }
      try {
        await this.wsAuthGuard.validateSession(socket.data.user);
        // Room membership is not an authorization decision. Permission
        // revocations must take effect before the next server broadcast.
        await this.wsAuthGuard.assertPermission(socketUserId, "chat.read");
      } catch {
        socket.disconnect(true);
        continue;
      }
      if (!participantIds.has(socketUserId)) {
        socket.leave(room);
        continue;
      }
      if (socket.id !== excludeSocketId) socket.emit(event, payload);
    }
  }

  private async broadcastUnreadCounts(conversationId: string) {
    const participantIds =
      await this.chatService.getActiveConversationParticipantIds(
        conversationId,
      );

    // Counts are user-specific (they exclude messages sent by that user), so
    // never broadcast one shared count to the conversation room. Resolve the
    // user room sockets and re-check both session and read permission rather
    // than trusting stale room membership.
    for (const userId of participantIds) {
      const sockets = await this.server.in(`user:${userId}`).fetchSockets();
      const authorizedSockets: Array<(typeof sockets)[number]> = [];
      for (const socket of sockets) {
        const socketUserId = socket.data?.user?.sub ?? socket.data?.user?.id;
        if (socketUserId !== userId) {
          socket.disconnect(true);
          continue;
        }
        try {
          await this.wsAuthGuard.validateSession(socket.data?.user);
          await this.wsAuthGuard.assertPermission(socketUserId, "chat.read");
          authorizedSockets.push(socket);
        } catch {
          socket.disconnect(true);
        }
      }
      if (authorizedSockets.length === 0) continue;

      const unreadCount = await this.chatService.getUnreadCount(
        conversationId,
        userId,
      );
      // Emit only to sockets checked above; emitting to the room could include
      // a revoked sibling socket that was not present during authorization.
      for (const socket of authorizedSockets) {
        socket.emit("chatUnreadCount", { conversationId, unreadCount });
      }
    }
  }

  private async removeParticipantSocketsFromRoom(
    conversationId: string,
    userId: string,
  ) {
    const room = `conversation:${conversationId}`;
    const sockets = await this.server.in(room).fetchSockets();
    for (const socket of sockets) {
      const socketUserId = socket.data?.user?.sub ?? socket.data?.user?.id;
      if (socketUserId === userId) socket.leave(room);
    }
  }

  private async withWsErrors<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof WsException) throw error;
      if (error instanceof HttpException) {
        const response = error.getResponse();
        const body =
          typeof response === "object" && response !== null
            ? (response as { code?: string; details?: unknown })
            : undefined;
        throw new WsException({
          code: body?.code ?? "CHAT_OPERATION_FAILED",
          details: body?.details ?? {},
        });
      }
      throw new WsException({ code: "CHAT_OPERATION_FAILED", details: {} });
    }
  }
}
