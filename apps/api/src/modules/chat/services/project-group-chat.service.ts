import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConversationType, Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ProjectGroupChatService {
  constructor(private readonly prisma: PrismaService) {}

  async ensure(projectId: string, db?: DbClient) {
    const existing = await this.find(projectId, db);
    if (existing) return existing;

    const project = await (db ?? this.prisma).project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, clientId: true, projectManagerId: true },
    });

    if (!project) return null;

    const participantIds = await this.resolveParticipantIds(projectId, project.projectManagerId, db);
    if (participantIds.length === 0) return null;

    return (db ?? this.prisma).conversation.create({
      data: {
        type: ConversationType.GROUP,
        projectId: project.id,
        clientId: project.clientId,
        title: `فريق مشروع ${project.name}`,
        participants: {
          create: participantIds.map((userId) => ({ userId })),
        },
      },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });
  }

  async addParticipant(projectId: string, userId: string, db?: DbClient) {
    const conversation = await this.ensure(projectId, db);
    if (!conversation) return null;

    const exists = await (db ?? this.prisma).conversationParticipant.findFirst({
      where: { conversationId: conversation.id, userId },
    });

    if (exists) return conversation;

    await (db ?? this.prisma).conversationParticipant.create({
      data: { conversationId: conversation.id, userId },
    });

    return this.find(projectId, db);
  }

  async syncParticipants(projectId: string, db?: DbClient) {
    const project = await (db ?? this.prisma).project.findUnique({
      where: { id: projectId },
      select: { id: true, projectManagerId: true },
    });

    if (!project) return null;

    const conversation = await this.ensure(projectId, db);
    if (!conversation) return null;

    const expectedIds = await this.resolveParticipantIds(projectId, project.projectManagerId, db);

    const currentParticipants = await (db ?? this.prisma).conversationParticipant.findMany({
      where: { conversationId: conversation.id },
      select: { id: true, userId: true },
    });

    const currentIds = currentParticipants.map((p) => p.userId);
    const missingIds = expectedIds.filter((id) => !currentIds.includes(id));
    const staleIds = currentParticipants
      .filter((p) => !expectedIds.includes(p.userId))
      .map((p) => p.id);

    if (missingIds.length > 0) {
      await (db ?? this.prisma).conversationParticipant.createMany({
        data: missingIds.map((userId) => ({
          conversationId: conversation.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    if (staleIds.length > 0) {
      await (db ?? this.prisma).conversationParticipant.deleteMany({
        where: { id: { in: staleIds } },
      });
    }

    return this.find(projectId, db);
  }

  async find(projectId: string, db?: DbClient) {
    return (db ?? this.prisma).conversation.findUnique({
      where: { projectId },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });
  }

  private async resolveParticipantIds(
    projectId: string,
    projectManagerId: string | null,
    db?: DbClient,
  ): Promise<string[]> {
    const memberIds = (
      await (db ?? this.prisma).projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    const assigneeIds = (
      await (db ?? this.prisma).task.findMany({
        where: { projectId, assignedTo: { not: null } },
        select: { assignedTo: true },
      })
    )
      .map((t) => t.assignedTo)
      .filter((id): id is string => !!id);

    return Array.from(
      new Set(
        [projectManagerId, ...memberIds, ...assigneeIds].filter(
          (id): id is string => !!id,
        ),
      ),
    );
  }
}
