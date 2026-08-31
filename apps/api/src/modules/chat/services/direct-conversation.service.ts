import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConversationType, Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class DirectConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(
    userAId: string,
    userBId: string,
    db?: DbClient,
    options?: {
      title?: string;
      clientId?: string;
    },
  ) {
    if (userAId === userBId) {
      throw new ForbiddenException({
        code: "DIRECT_CONVERSATION_SELF_FORBIDDEN",
        details: {},
      });
    }

    // The schema has no unique constraint for a participant pair. Serialize
    // callers using a transaction-scoped PostgreSQL advisory lock. Callers
    // already inside a transaction retain the same lock until that transaction
    // commits; callers without one get a short transaction here.
    if (!db) {
      return this.prisma.$transaction((tx) =>
        this.getOrCreateLocked(userAId, userBId, tx, options),
      );
    }

    return this.getOrCreateLocked(userAId, userBId, db, options);
  }

  private async getOrCreateLocked(
    userAId: string,
    userBId: string,
    db: DbClient,
    options?: { title?: string; clientId?: string },
  ) {
    const client = db;
    const lockKey = [userAId, userBId].sort().join(":");
    await client.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    `;

    // Keep authorization in the same transaction and lock scope as the
    // lookup/create so relationship changes cannot race this decision.
    await this.assertAllowedRelationship(userAId, userBId, client);

    const users = await client.user.findMany({
      where: { id: { in: [userAId, userBId] } },
      select: {
        id: true,
        name: true,
        isActive: true,
        role: { select: { name: true } },
      },
    });

    if (users.length !== 2) {
      throw new NotFoundException({
        code: "CHAT_USER_NOT_FOUND",
        details: {},
      });
    }

    const sender = users.find((user) => user.id === userAId)!;
    const target = users.find((user) => user.id === userBId)!;
    if (!sender.isActive) {
      throw new ForbiddenException({
        code: "CHAT_SENDER_USER_INACTIVE",
        details: {},
      });
    }
    if (!target.isActive) {
      throw new ForbiddenException({
        code: "CHAT_TARGET_USER_INACTIVE",
        details: {},
      });
    }

    if (options?.clientId) {
      const clientRecord = await client.client.findUnique({
        where: { id: options.clientId },
        select: { id: true, userId: true },
      });
      const clientParticipant = users.find(
        (user) => user.id === clientRecord?.userId,
      );
      if (
        !clientRecord ||
        (clientRecord.userId !== userAId && clientRecord.userId !== userBId) ||
        !clientParticipant ||
        clientParticipant.role.name !== "CLIENT"
      ) {
        throw new ConflictException({
          code: "DIRECT_CONVERSATION_CLIENT_RELATION_INVALID",
          details: {},
        });
      }
    }

    const existing = await this.findExisting(userAId, userBId, client);
    if (existing) {
      if (!existing.isActive) {
        throw new ForbiddenException({
          code: "CONVERSATION_INACTIVE",
          details: {},
        });
      }
      if (options?.clientId && existing.clientId !== options.clientId) {
        // A direct chat may have been created before the participant received
        // a client profile. Once a later lookup supplies that profile, repair
        // the missing association instead of treating the same valid chat as
        // a conflicting conversation. Existing non-null associations remain
        // immutable so a client cannot be silently reassigned.
        if (existing.clientId !== null) {
          throw new ConflictException({
            code: "DIRECT_CONVERSATION_CLIENT_RELATION_CONFLICT",
            details: {},
          });
        }

        return client.conversation.update({
          where: { id: existing.id },
          data: { clientId: options.clientId },
          include: {
            client: true,
            project: { select: { id: true, name: true } },
            participants: { include: { user: true } },
          },
        });
      }
      return existing;
    }

    const otherUser = users.find((user) => user.id !== userAId);
    return client.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        clientId: options?.clientId ?? null,
        title: options?.title ?? otherUser?.name ?? null,
        participants: {
          create: [
            {
              userId: userAId,
              source: "MANUAL",
              isActive: true,
            },
            {
              userId: userBId,
              source: "MANUAL",
              isActive: true,
            },
          ],
        },
      },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });
  }

  private async assertAllowedRelationship(
    userAId: string,
    userBId: string,
    db: DbClient,
  ) {
    const users = await db.user.findMany({
      where: { id: { in: [userAId, userBId] } },
      select: {
        id: true,
        isActive: true,
        role: { select: { name: true } },
        clientProfile: {
          select: {
            id: true,
            accountManager: true,
            projects: {
              where: { isArchived: false },
              select: {
                projectManagerId: true,
                members: { select: { userId: true } },
                tasks: { select: { assignedTo: true } },
              },
            },
          },
        },
      },
    });
    if (users.length !== 2)
      throw new NotFoundException({ code: "CHAT_USER_NOT_FOUND", details: {} });
    if (users.some((user) => !user.isActive))
      throw new ForbiddenException({ code: "CHAT_USER_INACTIVE", details: {} });

    // userAId is the authenticated caller for direct-conversation requests.
    // An ADMIN may initiate a chat with any valid active participant; this is
    // intentionally scoped to the caller, rather than allowing a non-admin to
    // bypass the relationship policy merely by targeting an administrator.
    const caller = users.find((user) => user.id === userAId);
    if (caller?.role.name === "ADMIN") return;

    const clientUser = users.find((user) => user.role.name === "CLIENT");
    if (!clientUser) return; // Internal users may communicate with one another.
    const other = users.find((user) => user.id !== clientUser.id)!;
    if (other.role.name === "CLIENT") {
      throw new ForbiddenException({
        code: "DIRECT_CONVERSATION_TARGET_FORBIDDEN",
        details: {},
      });
    }
    const profile = clientUser.clientProfile;
    const related =
      profile &&
      (profile.accountManager === other.id ||
        profile.projects.some(
          (project) =>
            project.projectManagerId === other.id ||
            project.members.some((member) => member.userId === other.id) ||
            project.tasks.some((task) => task.assignedTo === other.id),
        ));
    if (!related)
      throw new ForbiddenException({
        code: "DIRECT_CONVERSATION_TARGET_FORBIDDEN",
        details: {},
      });
  }

  private async findExisting(userAId: string, userBId: string, db: DbClient) {
    const conversations = await db.conversation.findMany({
      where: {
        type: ConversationType.DIRECT,
        participants: { every: { userId: { in: [userAId, userBId] } } },
      },
      include: {
        participants: { select: { userId: true } },
        client: true,
        project: { select: { id: true, name: true } },
      },
    });

    const expected = [userAId, userBId].sort();
    const matches = conversations.filter((conversation) => {
      const ids = conversation.participants
        .map((participant) => participant.userId)
        .sort();
      return (
        ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]
      );
    });

    if (matches.length > 1) {
      throw new ConflictException({
        code: "DIRECT_CONVERSATION_DUPLICATE_INTEGRITY",
        details: {},
      });
    }
    if (matches.length === 0) return null;

    return db.conversation.findUnique({
      where: { id: matches[0].id },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });
  }
}
