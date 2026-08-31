import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ConversationParticipantSource,
  ConversationType,
  Prisma,
} from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { ChatAttachmentService } from "../../../common/storage/chat-attachment.service";
import { StorageService } from "../../../common/storage/storage.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import {
  AddParticipantDto,
  CreateConversationDto,
  CreateMessageDto,
  GetConversationsQueryDto,
  UpdateMessageDto,
} from "../dto/chat.dto";
import { DirectConversationService } from "./direct-conversation.service";
import { ChatPresenceService } from "./chat-presence.service";

interface AttachmentData {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

const userSummarySelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  lastSeenAt: true,
});

const messageInclude = Prisma.validator<Prisma.MessageInclude>()({
  sender: { select: userSummarySelect },
  deletedBy: { select: userSummarySelect },
  attachments: true,
  parentMessage: {
    select: {
      id: true,
      content: true,
      deletedAt: true,
      sender: { select: userSummarySelect },
    },
  },
});

const conversationInclude = Prisma.validator<Prisma.ConversationInclude>()({
  client: {
    select: {
      id: true,
      companyName: true,
      businessName: true,
      user: { select: userSummarySelect },
    },
  },
  project: { select: { id: true, name: true } },
  participants: {
    where: { isActive: true, user: { isActive: true } },
    include: {
      user: { select: userSummarySelect },
    },
  },
});

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
    private readonly chatAttachmentService: ChatAttachmentService,
    private readonly directConversationService: DirectConversationService,
    private readonly presenceService: ChatPresenceService,
  ) {}

  async getUserConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: {
        userId,
        isActive: true,
        user: { isActive: true },
        conversation: { isActive: true },
      },
      select: { conversationId: true },
    });

    return participants.map((participant) => participant.conversationId);
  }

  async findMyConversations(userId: string, query: GetConversationsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const where: Prisma.ConversationWhereInput = {
      participants: {
        some: { userId, isActive: true, user: { isActive: true } },
      },
      isActive: true,
    };

    if (query.type) {
      where.type = query.type as ConversationType;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          ...conversationInclude,
          messages: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 1,
            include: messageInclude,
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: await Promise.all(
        conversations.map(async (conversation) => ({
          ...this.mapConversation(conversation),
          messageCount: conversation._count.messages,
          unreadCount: await this.getUnreadCount(conversation.id, userId),
          lastMessage: conversation.messages[0]
            ? await this.mapMessage(conversation.messages[0])
            : null,
        })),
      ),
      total,
      page,
      limit,
    };
  }

  async assertConversationAccess(id: string, userId: string): Promise<void> {
    await this.findConversationRecord(id, userId);
  }

  /**
   * Project group access must be checked before the group is ensured. The
   * participant list is derived from these same project roles, so this keeps
   * first-time access consistent with subsequent conversation checks.
   */
  async assertProjectAccess(projectId: string, userId: string): Promise<void> {
    // Resolve the project first so elevated roles still need a real, active
    // project. This prevents the role shortcut from becoming cross-project
    // (or archived-project) access.
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, isArchived: false },
      select: { id: true },
    });

    if (!project) {
      const exists = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      if (!exists) {
        throw new NotFoundException({
          code: "PROJECT_NOT_FOUND",
          details: { projectId },
        });
      }
      throw new ForbiddenException({
        code: "PROJECT_ACCESS_FORBIDDEN",
        details: {},
      });
    }

    const actor = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: { role: { select: { name: true } } },
    });
    if (actor && ["ADMIN", "OWNER"].includes(actor.role.name)) return;

    const eligible = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { projectManagerId: userId, manager: { isActive: true } },
          { members: { some: { userId, user: { isActive: true } } } },
          {
            tasks: {
              some: { assignedTo: userId, assignee: { isActive: true } },
            },
          },
          { client: { userId, user: { isActive: true } } },
        ],
      },
      select: { id: true },
    });

    if (eligible) return;

    throw new ForbiddenException({
      code: "PROJECT_ACCESS_FORBIDDEN",
      details: {},
    });
  }

  /** Used by the gateway to prevent stale room members receiving broadcasts. */
  async getActiveConversationParticipantIds(
    conversationId: string,
  ): Promise<Set<string>> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        isActive: true,
        type: true,
        projectId: true,
        project: { select: { isArchived: true } },
        participants: {
          where: { isActive: true },
          select: { userId: true, user: { select: { isActive: true } } },
        },
      },
    });

    if (!conversation?.isActive) return new Set();
    const participantIds = conversation.participants
      .filter((participant) => participant.user.isActive)
      .map((participant) => participant.userId);

    // Elevated users are deliberately not inserted as participants. Include
    // their verified project access for authorized websocket broadcasts only.
    if (
      conversation.type === ConversationType.GROUP &&
      conversation.projectId &&
      !conversation.project?.isArchived
    ) {
      const elevatedUsers = await this.prisma.user.findMany({
        where: {
          isActive: true,
          role: { name: { in: ["ADMIN", "OWNER"] } },
        },
        select: { id: true },
      });
      participantIds.push(...elevatedUsers.map((user) => user.id));
    }

    return new Set(participantIds);
  }

  async findConversation(id: string, userId?: string) {
    return this.getConversationDetails(id, userId);
  }

  /** Returns the canonical conversation DTO used by all conversation routes. */
  async getConversationDetails(id: string, userId?: string) {
    await this.findConversationRecord(id, userId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        ...conversationInclude,
        messages: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          include: messageInclude,
        },
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException({
        code: "CONVERSATION_NOT_FOUND",
        details: { id },
      });
    }

    return {
      ...this.mapConversation(conversation),
      messageCount: conversation._count.messages,
      unreadCount: userId
        ? await this.getUnreadCount(conversation.id, userId)
        : 0,
      lastMessage: conversation.messages[0]
        ? await this.mapMessage(conversation.messages[0])
        : null,
    };
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const participantIds = Array.from(new Set([userId, ...dto.participantIds]));

    if (dto.type === ConversationType.DIRECT) {
      if (participantIds.length !== 2) {
        throw new BadRequestException({
          code: "DIRECT_CONVERSATION_PARTICIPANT_COUNT_INVALID",
          details: {},
        });
      }

      const conversation = await this.directConversationService.getOrCreate(
        userId,
        participantIds.find((id) => id !== userId)!,
        undefined,
        { title: dto.title, clientId: dto.clientId },
      );

      return this.mapConversation(conversation);
    }

    await this.assertGroupCreationEligibility(userId, participantIds, dto);

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type,
        clientId: dto.clientId ?? null,
        projectId: dto.projectId ?? null,
        title: dto.title ?? null,
        participants: {
          create: participantIds.map((id) => ({
            userId: id,
            source: ConversationParticipantSource.MANUAL,
          })),
        },
      },
      include: conversationInclude,
    });

    return this.mapConversation(conversation);
  }

  async addParticipant(
    conversationId: string,
    dto: AddParticipantDto,
    currentUserId: string,
  ) {
    const conversation = await this.findConversationRecord(
      conversationId,
      currentUserId,
    );

    await this.assertParticipantMutationAllowed(conversation, currentUserId);
    await this.assertParticipantEligible(conversation, dto.userId);

    const existing = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: dto.userId },
    });

    if (!existing) {
      await this.prisma.conversationParticipant.create({
        data: {
          conversationId,
          userId: dto.userId,
          source: ConversationParticipantSource.MANUAL,
          isActive: true,
        },
      });
    } else {
      await this.prisma.conversationParticipant.update({
        where: { id: existing.id },
        data: {
          source: ConversationParticipantSource.MANUAL,
          isActive: true,
        },
      });
    }

    await this.findConversationRecord(conversationId, currentUserId);
    return this.getConversationDetails(conversationId, currentUserId);
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    currentUserId: string,
  ) {
    const conversation = await this.findConversationRecord(
      conversationId,
      currentUserId,
    );

    await this.assertParticipantMutationAllowed(conversation, currentUserId);
    if (conversation.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: conversation.projectId },
        select: {
          projectManagerId: true,
          client: { select: { userId: true } },
        },
      });
      if (
        userId === project?.projectManagerId ||
        userId === project?.client.userId
      ) {
        throw new ForbiddenException({
          code: "PROJECT_CHAT_REQUIRED_PARTICIPANT",
          details: {},
        });
      }
    }

    const removed = await this.prisma.conversationParticipant.deleteMany({
      where: { conversationId, userId },
    });

    if (removed.count > 0) {
      this.eventEmitter.emit("chat.participantRemoved", {
        conversationId,
        userId,
      });
    }

    await this.findConversationRecord(conversationId, currentUserId);
    return this.getConversationDetails(conversationId, currentUserId);
  }

  async createDirectMessage(
    senderId: string,
    targetUserId: string,
    dto: CreateMessageDto,
  ) {
    const conversation = await this.ensureDirectConversation(
      senderId,
      targetUserId,
    );

    return this.createMessage(senderId, {
      ...dto,
      conversationId: conversation.id,
    });
  }

  async createMessage(senderId: string, dto: CreateMessageDto) {
    const conversation = await this.findConversationRecord(
      dto.conversationId,
      senderId,
    );
    const parentMessageId = await this.ensureParentMessageId(
      dto.parentMessageId,
      conversation.id,
    );

    const created = await this.prisma.message.create({
      data: Prisma.validator<Prisma.MessageUncheckedCreateInput>()({
        conversationId: conversation.id,
        senderId,
        content: dto.content,
        parentMessageId,
      }),
      include: messageInclude,
    });

    await this.touchConversation(conversation.id);

    this.notifyParticipants(
      conversation,
      senderId,
      dto.content,
      created.id,
    ).catch(() => undefined);

    const normalized = await this.getMessageById(created.id);
    this.eventEmitter.emit("chat.messageCreated", {
      conversationId: conversation.id,
      message: normalized,
    });
    this.eventEmitter.emit("chat.unreadCountChanged", {
      conversationId: conversation.id,
    });

    return normalized;
  }

  async createMessageWithAttachments(
    senderId: string,
    dto: CreateMessageDto,
    attachments: AttachmentData[],
  ) {
    // Files are uploaded by the controller before this method is called. Keep
    // every validation and post-upload operation inside the cleanup boundary;
    // in particular, a missing reply parent must not strand the uploads.
    let conversation: Awaited<ReturnType<typeof this.findConversationRecord>>;
    let created:
      | Awaited<ReturnType<typeof this.prisma.message.create>>
      | undefined;

    try {
      conversation = await this.findConversationRecord(
        dto.conversationId,
        senderId,
      );

      if (typeof dto.content !== "string" || dto.content.trim().length === 0) {
        throw new BadRequestException({
          code: "MESSAGE_CONTENT_REQUIRED",
          details: {},
        });
      }
      if (
        !Array.isArray(attachments) ||
        attachments.some(
          (attachment) =>
            !attachment ||
            typeof attachment.key !== "string" ||
            !attachment.key.trim() ||
            typeof attachment.originalName !== "string" ||
            !attachment.originalName.trim() ||
            typeof attachment.mimeType !== "string" ||
            !attachment.mimeType.trim() ||
            typeof attachment.size !== "number" ||
            !Number.isFinite(attachment.size) ||
            attachment.size <= 0,
        )
      ) {
        throw new BadRequestException({
          code: "CHAT_ATTACHMENT_METADATA_INVALID",
          details: {},
        });
      }

      const parentMessageId = await this.ensureParentMessageId(
        dto.parentMessageId,
        conversation.id,
      );

      // The message and its attachment rows must commit or roll back together.
      created = await this.prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: Prisma.validator<Prisma.MessageUncheckedCreateInput>()({
            conversationId: conversation.id,
            senderId,
            content: dto.content,
            parentMessageId,
          }),
          include: messageInclude,
        });

        if (attachments.length > 0) {
          await tx.messageAttachment.createMany({
            data: attachments.map((attachment) => ({
              messageId: message.id,
              filePath: attachment.key,
              fileName: attachment.originalName,
              fileType: attachment.mimeType,
            })),
          });
        }
        return message;
      });

      await this.touchConversation(conversation.id);

      this.notifyParticipants(
        conversation,
        senderId,
        dto.content,
        created.id,
        attachments.length,
      ).catch(() => undefined);

      const normalized = await this.getMessageById(created.id);
      this.eventEmitter.emit("chat.messageCreated", {
        conversationId: conversation.id,
        message: normalized,
      });
      this.eventEmitter.emit("chat.unreadCountChanged", {
        conversationId: conversation.id,
      });

      return normalized;
    } catch (error) {
      // This also covers conversation/reply validation and failures after the
      // transaction. Never leave any object key uploaded for this operation.
      if (created?.id) {
        await this.prisma.message
          .delete({ where: { id: created.id } })
          .catch(() => undefined);
      }
      await this.chatAttachmentService.deleteUploadedAttachments(
        Array.isArray(attachments)
          ? attachments
              .map((attachment) => attachment?.key)
              .filter((key): key is string => Boolean(key))
          : [],
      );
      throw error;
    }
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
  ) {
    await this.findConversationRecord(conversationId, userId);
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: Prisma.validator<Prisma.MessageSelect>()({
        id: true,
        conversationId: true,
        senderId: true,
        deletedAt: true,
      }),
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException({ code: "MESSAGE_NOT_FOUND", details: {} });
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException({
        code: "MESSAGE_EDIT_FORBIDDEN",
        details: {},
      });
    }

    if (message.deletedAt) {
      throw new ForbiddenException({
        code: "DELETED_MESSAGE_EDIT_FORBIDDEN",
        details: {},
      });
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: Prisma.validator<Prisma.MessageUncheckedUpdateInput>()({
        content: dto.content,
        editedAt: new Date(),
      }),
    });

    await this.touchConversation(conversationId);

    const normalized = await this.getMessageById(messageId);
    this.eventEmitter.emit("chat.messageUpdated", {
      conversationId,
      message: normalized,
    });

    return normalized;
  }

  async deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string,
  ) {
    await this.findConversationRecord(conversationId, userId);
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: Prisma.validator<Prisma.MessageSelect>()({
        id: true,
        conversationId: true,
        senderId: true,
        deletedAt: true,
      }),
    });

    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException({ code: "MESSAGE_NOT_FOUND", details: {} });
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException({
        code: "MESSAGE_DELETE_FORBIDDEN",
        details: {},
      });
    }

    if (!message.deletedAt) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: Prisma.validator<Prisma.MessageUncheckedUpdateInput>()({
          deletedAt: new Date(),
          deletedById: userId,
        }),
      });
    }

    await this.touchConversation(conversationId);

    const normalized = await this.getMessageById(messageId);
    this.eventEmitter.emit("chat.messageDeleted", {
      conversationId,
      message: normalized,
    });

    return normalized;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    query?: { cursor?: string; limit?: number },
  ) {
    await this.findConversationRecord(conversationId, userId);

    const limit = Number(query?.limit) || 50;
    const cursor = this.decodeMessageCursor(query?.cursor, conversationId);
    // The cursor is the oldest item in the current display page. Fetch in
    // reverse order so both the initial request (latest history) and cursor
    // requests (older history) are bounded by the same index-friendly query.
    const where: Prisma.MessageWhereInput = {
      conversationId,
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }
        : {}),
    };

    const messages = await this.prisma.message.findMany({
      where,
      include: messageInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const hasMore = messages.length > limit;
    const page = (hasMore ? messages.slice(0, limit) : messages).reverse();
    const oldest = page[0];

    return {
      __standardResponse: true as const,
      // Always return chronological display order, including cursor pages.
      data: await Promise.all(page.map((message) => this.mapMessage(message))),
      meta: {
        hasMore,
        nextCursor:
          hasMore && oldest
            ? this.encodeMessageCursor(
                conversationId,
                oldest.createdAt,
                oldest.id,
              )
            : null,
      },
    };
  }

  async markConversationRead(conversationId: string, userId: string) {
    await this.findConversationRecord(conversationId, userId);
    const lastReadAt = new Date();
    // Keep the boundary monotonic when REST and socket marks race (for
    // example, during reconnect). A delayed request must never move it back.
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
        OR: [{ lastReadAt: null }, { lastReadAt: { lt: lastReadAt } }],
      },
      data: { lastReadAt },
    });

    this.eventEmitter.emit("chat.unreadCountChanged", { conversationId });

    return {
      conversationId,
      lastReadAt: lastReadAt.toISOString(),
      unreadCount: 0,
    };
  }

  async getUnreadCount(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { lastReadAt: true },
    });
    return this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        deletedAt: null,
        ...(participant?.lastReadAt
          ? { createdAt: { gt: participant.lastReadAt } }
          : {}),
      },
    });
  }

  private encodeMessageCursor(
    conversationId: string,
    createdAt: Date,
    id: string,
  ) {
    return Buffer.from(
      JSON.stringify({
        conversationId,
        createdAt: createdAt.toISOString(),
        id,
      }),
    ).toString("base64url");
  }

  private decodeMessageCursor(
    value: string | undefined,
    conversationId: string,
  ): { createdAt: Date; id: string } | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(
        Buffer.from(value, "base64url").toString("utf8"),
      ) as {
        conversationId?: unknown;
        createdAt?: unknown;
        id?: unknown;
      };
      if (
        parsed.conversationId !== conversationId ||
        typeof parsed.createdAt !== "string" ||
        typeof parsed.id !== "string"
      )
        throw new Error();
      const createdAt = new Date(parsed.createdAt);
      if (
        Number.isNaN(createdAt.getTime()) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          parsed.id,
        )
      )
        throw new Error();
      return { createdAt, id: parsed.id };
    } catch {
      throw new BadRequestException({
        code: "INVALID_MESSAGE_CURSOR",
        details: {},
      });
    }
  }

  private async assertGroupCreationEligibility(
    creatorId: string,
    participantIds: string[],
    dto: CreateConversationDto,
  ) {
    const actor = await this.prisma.user.findUnique({
      where: { id: creatorId, isActive: true },
      select: { role: { select: { name: true } } },
    });
    if (!actor)
      throw new ForbiddenException({
        code: "CHAT_CREATOR_NOT_ELIGIBLE",
        details: {},
      });
    const users = await this.prisma.user.findMany({
      where: { id: { in: participantIds }, isActive: true },
      select: { id: true, role: { select: { name: true } } },
    });
    if (users.length !== participantIds.length)
      throw new ForbiddenException({
        code: "CHAT_PARTICIPANT_NOT_ELIGIBLE",
        details: {},
      });

    if (dto.projectId) {
      await this.assertProjectAccess(dto.projectId, creatorId);
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { clientId: true },
      });
      if (!project || dto.clientId !== project.clientId)
        throw new ForbiddenException({
          code: "CHAT_PROJECT_CLIENT_RELATION_INVALID",
          details: {},
        });
      const eligible = await this.getProjectEligibleUserIds(dto.projectId);
      if (
        participantIds.some((id) => {
          const user = users.find((candidate) => candidate.id === id);
          return (
            !eligible.has(id) &&
            !["ADMIN", "OWNER"].includes(user?.role.name ?? "")
          );
        })
      )
        throw new ForbiddenException({
          code: "CHAT_PARTICIPANT_NOT_ELIGIBLE_FOR_PROJECT",
          details: {},
        });
      return;
    }

    // Conversation has no owner column; OWNER is the explicit standalone owner role.
    if (!["ADMIN", "OWNER"].includes(actor.role.name))
      throw new ForbiddenException({
        code: "STANDALONE_GROUP_OWNER_REQUIRED",
        details: {},
      });
    if (!dto.clientId) {
      if (users.some((user) => user.role.name === "CLIENT"))
        throw new ForbiddenException({
          code: "CHAT_CLIENT_SCOPE_REQUIRED",
          details: {},
        });
      return;
    }
    const eligible = await this.getClientEligibleUserIds(dto.clientId);
    if (
      users.some(
        (user) =>
          !eligible.has(user.id) &&
          !["ADMIN", "OWNER"].includes(user.role.name),
      )
    )
      throw new ForbiddenException({
        code: "CHAT_PARTICIPANT_NOT_ELIGIBLE_FOR_CLIENT",
        details: {},
      });
  }

  private async assertParticipantEligible(conversation: any, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!user)
      throw new ForbiddenException({
        code: "CHAT_PARTICIPANT_NOT_ELIGIBLE",
        details: {},
      });
    if (conversation.projectId) {
      if (
        !(await this.getProjectEligibleUserIds(conversation.projectId)).has(
          userId,
        )
      )
        throw new ForbiddenException({
          code: "CHAT_PARTICIPANT_NOT_ELIGIBLE_FOR_PROJECT",
          details: {},
        });
    } else if (!conversation.clientId && user.role.name === "CLIENT") {
      throw new ForbiddenException({
        code: "CHAT_CLIENT_SCOPE_REQUIRED",
        details: {},
      });
    } else if (
      conversation.clientId &&
      !(await this.getClientEligibleUserIds(conversation.clientId)).has(
        userId,
      ) &&
      !["ADMIN", "OWNER"].includes(user.role.name)
    ) {
      throw new ForbiddenException({
        code: "CHAT_PARTICIPANT_NOT_ELIGIBLE_FOR_CLIENT",
        details: {},
      });
    }
  }

  private async assertParticipantMutationAllowed(
    conversation: any,
    currentUserId: string,
  ) {
    if (conversation.type === ConversationType.DIRECT)
      throw new ForbiddenException({
        code: "DIRECT_CONVERSATION_PARTICIPANT_MUTATION_FORBIDDEN",
        details: {},
      });
    const actor = await this.prisma.user.findUnique({
      where: { id: currentUserId, isActive: true },
      select: { role: { select: { name: true } } },
    });
    if (conversation.projectId) {
      await this.assertProjectAccess(conversation.projectId, currentUserId);
      return;
    }
    if (!actor || !["ADMIN", "OWNER"].includes(actor.role.name))
      throw new ForbiddenException({
        code: "STANDALONE_GROUP_OWNER_REQUIRED",
        details: {},
      });
  }

  private async getClientEligibleUserIds(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        userId: true,
        user: { select: { isActive: true } },
        accountManager: true,
        projects: {
          where: { isArchived: false },
          select: {
            projectManagerId: true,
            members: {
              where: { user: { isActive: true } },
              select: { userId: true },
            },
            tasks: {
              where: {
                assignedTo: { not: null },
                assignee: { isActive: true },
              },
              select: { assignedTo: true },
            },
          },
        },
      },
    });
    if (!client)
      throw new NotFoundException({
        code: "CHAT_CLIENT_NOT_FOUND",
        details: { clientId },
      });
    return new Set(
      [
        client.user?.isActive ? client.userId : null,
        client.accountManager,
        ...client.projects.flatMap((project) => [
          project.projectManagerId,
          ...project.members.map((member) => member.userId),
          ...project.tasks.map((task) => task.assignedTo),
        ]),
      ].filter((id): id is string => Boolean(id)),
    );
  }

  private async getProjectEligibleUserIds(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        projectManagerId: true,
        manager: { select: { isActive: true } },
        client: {
          select: { userId: true, user: { select: { isActive: true } } },
        },
        members: {
          where: { user: { isActive: true } },
          select: { userId: true },
        },
        tasks: {
          where: { assignedTo: { not: null }, assignee: { isActive: true } },
          select: { assignedTo: true },
        },
      },
    });
    if (!project)
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId },
      });
    return new Set(
      [
        project.manager?.isActive ? project.projectManagerId : null,
        project.client.user?.isActive ? project.client.userId : null,
        ...project.members.map((m) => m.userId),
        ...project.tasks.map((t) => t.assignedTo),
      ].filter((id): id is string => Boolean(id)),
    );
  }

  private async ensureDirectConversation(
    senderId: string,
    targetUserId: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        isActive: true,
        clientProfile: {
          select: { id: true },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException({
        code: "CHAT_TARGET_USER_NOT_FOUND",
        details: {},
      });
    }
    if (!targetUser.isActive) {
      throw new ForbiddenException({
        code: "CHAT_TARGET_USER_INACTIVE",
        details: {},
      });
    }

    const conversation = await this.directConversationService.getOrCreate(
      senderId,
      targetUserId,
      undefined,
      {
        clientId: targetUser.clientProfile?.id ?? undefined,
      },
    );

    if (!conversation) {
      throw new NotFoundException({
        code: "DIRECT_CONVERSATION_CREATE_FAILED",
        details: {},
      });
    }

    return conversation;
  }

  private async ensureParentMessageId(
    parentMessageId: string | undefined,
    conversationId: string,
  ) {
    if (!parentMessageId) {
      return null;
    }

    const parent = await this.prisma.message.findUnique({
      where: { id: parentMessageId },
      select: { id: true, conversationId: true },
    });

    if (!parent || parent.conversationId !== conversationId) {
      throw new NotFoundException({
        code: "REPLY_TARGET_NOT_FOUND",
        details: {},
      });
    }

    return parent.id;
  }

  private async touchConversation(conversationId: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  private async findConversationRecord(id: string, userId?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: conversationInclude,
    });

    if (!conversation) {
      throw new NotFoundException({
        code: "CONVERSATION_NOT_FOUND",
        details: { id },
      });
    }

    if (
      userId &&
      !conversation.participants.some(
        (participant) =>
          participant.userId === userId &&
          participant.isActive &&
          participant.user.isActive,
      )
    ) {
      // Membership remains strict for direct and standalone groups. A project
      // GROUP is the sole explicit exception: ADMIN/OWNER users may access it
      // after the same project authorization used by project-group routes.
      if (
        conversation.type !== ConversationType.GROUP ||
        !conversation.projectId
      ) {
        throw new ForbiddenException({
          code: "CONVERSATION_PARTICIPATION_FORBIDDEN",
          details: {},
        });
      }
      const actor = await this.prisma.user.findUnique({
        where: { id: userId, isActive: true },
        select: { role: { select: { name: true } } },
      });
      if (!actor || !["ADMIN", "OWNER"].includes(actor.role.name)) {
        throw new ForbiddenException({
          code: "CONVERSATION_PARTICIPATION_FORBIDDEN",
          details: {},
        });
      }
      await this.assertProjectAccess(conversation.projectId, userId);
    }

    if (!conversation.isActive) {
      throw new ForbiddenException({
        code: "CONVERSATION_INACTIVE",
        details: {},
      });
    }

    return conversation;
  }

  private mapConversation(conversation: any) {
    const clientName =
      conversation.client?.companyName ??
      conversation.client?.businessName ??
      conversation.client?.user?.name ??
      null;

    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      isActive: conversation.isActive,
      updatedAt: conversation.updatedAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      clientId: conversation.clientId,
      clientName,
      messageCount: conversation._count?.messages ?? 0,
      lastMessage: null,
      project: conversation.project
        ? {
            id: conversation.project.id,
            name: conversation.project.name,
          }
        : null,
      participants: conversation.participants.map((participant: any) => ({
        id: participant.user.id,
        name: participant.user.name,
        email: participant.user.email,
        avatarUrl: participant.user.avatarUrl,
        isActive: participant.user.isActive,
        lastLoginAt: participant.user.lastLoginAt?.toISOString() ?? null,
        lastSeenAt:
          this.presenceService
            .lastSeenAt(participant.user.id, participant.user.lastSeenAt)
            ?.toISOString() ?? null,
        isOnline: this.presenceService.isOnline(participant.user.id),
      })),
    };
  }

  private async getMessageById(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });

    if (!message) {
      throw new NotFoundException({ code: "MESSAGE_NOT_FOUND", details: {} });
    }

    return this.mapMessage(message);
  }

  private async mapMessage(message: any) {
    const attachments =
      !message.deletedAt &&
      message.attachments &&
      message.attachments.length > 0
        ? await this.attachUrls(message.attachments)
        : [];

    return {
      id: message.id,
      conversationId: message.conversationId,
      content: message.deletedAt ? "" : message.content,
      // Keep deletion machine-readable; clients localize the presentation.
      displayContent: message.deletedAt ? "" : message.content,
      status: message.deletedAt ? "DELETED" : "ACTIVE",
      isDeleted: Boolean(message.deletedAt),
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString() ?? null,
      deletedAt: message.deletedAt?.toISOString() ?? null,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
        avatarUrl: message.sender.avatarUrl,
        isActive: message.sender.isActive,
        lastLoginAt: message.sender.lastLoginAt?.toISOString() ?? null,
        lastSeenAt:
          this.presenceService
            .lastSeenAt(message.sender.id, message.sender.lastSeenAt)
            ?.toISOString() ?? null,
        isOnline: this.presenceService.isOnline(message.sender.id),
      },
      deletedBy: message.deletedBy
        ? {
            id: message.deletedBy.id,
            name: message.deletedBy.name,
          }
        : null,
      attachments,
      replyTo: message.parentMessage
        ? {
            id: message.parentMessage.id,
            content: message.parentMessage.deletedAt
              ? ""
              : message.parentMessage.content,
            status: message.parentMessage.deletedAt ? "DELETED" : "ACTIVE",
            isDeleted: Boolean(message.parentMessage.deletedAt),
            senderName: message.parentMessage.sender?.name ?? "",
          }
        : null,
    };
  }

  private async attachUrls(attachments: Array<any>) {
    const attachmentKeys = attachments.map((attachment) => attachment.filePath);
    const urlMap =
      await this.storageService.getMultiplePresignedUrls(attachmentKeys);

    return attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      filePath: attachment.filePath,
      uploadedAt: attachment.uploadedAt?.toISOString?.() ?? null,
      url: urlMap.get(attachment.filePath) || null,
    }));
  }

  private async notifyParticipants(
    conversation: any,
    senderId: string,
    content: string,
    messageId: string,
    attachmentCount = 0,
  ) {
    const recipients = conversation.participants
      .map((participant: any) => participant.userId)
      .filter((participantId: string) => participantId !== senderId);

    if (recipients.length === 0) return;

    const sender =
      conversation.participants.find(
        (participant: any) => participant.userId === senderId,
      )?.user?.name ?? "";
    await this.notificationsService.notifyUsers({
      userIds: recipients,
      entityId: conversation.id,
      entityType: "conversation",
      eventType: "NEW_MESSAGE",
      metadata: { messageId, senderName: sender, attachmentCount },
    });
  }
}
