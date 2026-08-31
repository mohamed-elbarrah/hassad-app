import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  ConversationParticipantSource,
  ConversationType,
  Prisma,
} from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ProjectGroupChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** Synchronize project-derived membership without affecting manual members. */
  async ensure(projectId: string, db?: DbClient) {
    const client = db ?? this.prisma;
    const existing = await this.find(projectId, db);
    if (existing?.isActive === false) {
      throw new ForbiddenException({
        code: "CONVERSATION_INACTIVE",
        details: {},
      });
    }
    if (existing && existing.type !== ConversationType.GROUP) {
      throw new ForbiddenException({
        code: "PROJECT_GROUP_CONVERSATION_TYPE_INVALID",
        details: { projectId },
      });
    }

    const project = await client.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        clientId: true,
        projectManagerId: true,
        isArchived: true,
      },
    });
    if (!project) return null;
    if (project.isArchived) {
      throw new ForbiddenException({
        code: "PROJECT_ARCHIVED",
        details: { projectId },
      });
    }

    const participantIds = await this.resolveParticipantIds(
      projectId,
      project.projectManagerId,
      db,
    );

    // Upsert prevents duplicate groups when equivalent flows race.
    const conversation = await client.conversation.upsert({
      where: { projectId },
      update: { title: project.name, clientId: project.clientId },
      create: {
        type: ConversationType.GROUP,
        projectId: project.id,
        clientId: project.clientId,
        title: project.name,
        participants: {
          create: participantIds.map((userId) => ({
            userId,
            source: ConversationParticipantSource.AUTO,
          })),
        },
      },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: { include: { user: true } },
      },
    });

    // Repair existing groups as well as newly-created ones. Never change a
    // manual row back to automatic provenance.
    for (const userId of participantIds) {
      await client.conversationParticipant.upsert({
        where: {
          conversationId_userId: { conversationId: conversation.id, userId },
        },
        create: {
          conversationId: conversation.id,
          userId,
          source: ConversationParticipantSource.AUTO,
        },
        update: { isActive: true },
      });
    }

    return this.find(projectId, db);
  }

  async addParticipant(projectId: string, userId: string, db?: DbClient) {
    const activeProject = await (db ?? this.prisma).project.findFirst({
      where: { id: projectId, isArchived: false },
      select: { id: true },
    });
    if (!activeProject) return null;

    // Authorize before ensure(): an invalid request must not create or update
    // the project conversation as a side effect.
    const eligibleUser = await (db ?? this.prisma).user.findFirst({
      where: {
        id: userId,
        isActive: true,
        OR: [
          { managedProjects: { some: { id: projectId } } },
          { projectMembers: { some: { projectId } } },
          { assignedTasks: { some: { projectId } } },
          { clientProfile: { projects: { some: { id: projectId } } } },
        ],
      },
      select: { id: true },
    });
    if (!eligibleUser) {
      throw new ForbiddenException({
        code: "USER_NOT_ELIGIBLE_FOR_PROJECT_CHAT",
        details: { projectId },
      });
    }

    const conversation = await this.ensure(projectId, db);
    if (!conversation) return null;

    await (db ?? this.prisma).conversationParticipant.upsert({
      where: {
        conversationId_userId: { conversationId: conversation.id, userId },
      },
      create: {
        conversationId: conversation.id,
        userId,
        source: ConversationParticipantSource.AUTO,
      },
      update: { isActive: true },
    });

    return this.find(projectId, db);
  }

  async syncParticipants(projectId: string, db?: DbClient) {
    const project = await (db ?? this.prisma).project.findUnique({
      where: { id: projectId },
      select: { id: true, projectManagerId: true, isArchived: true },
    });

    if (!project) return null;

    const conversation = await this.ensure(projectId, db);
    if (!conversation) return null;

    const expectedIds = await this.resolveParticipantIds(
      projectId,
      project.projectManagerId,
      db,
    );

    const expectedSet = new Set(expectedIds);
    for (const userId of expectedIds) {
      await (db ?? this.prisma).conversationParticipant.upsert({
        where: {
          conversationId_userId: { conversationId: conversation.id, userId },
        },
        create: {
          conversationId: conversation.id,
          userId,
          source: ConversationParticipantSource.AUTO,
        },
        update: { isActive: true },
      });
    }

    // Only automatic members may be disabled; manual membership is preserved.
    await (db ?? this.prisma).conversationParticipant.updateMany({
      where: {
        conversationId: conversation.id,
        source: ConversationParticipantSource.AUTO,
        userId: { notIn: Array.from(expectedSet) },
        isActive: true,
      },
      data: { isActive: false },
    });

    return this.find(projectId, db);
  }

  async find(projectId: string, db?: DbClient) {
    return (db ?? this.prisma).conversation.findUnique({
      where: { projectId },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        participants: {
          where: { isActive: true, user: { isActive: true } },
          include: { user: true },
        },
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
        where: { projectId, user: { isActive: true } },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    const assigneeIds = (
      await (db ?? this.prisma).task.findMany({
        where: {
          projectId,
          assignedTo: { not: null },
          assignee: { isActive: true },
        },
        select: { assignedTo: true },
      })
    )
      .map((t) => t.assignedTo)
      .filter((id): id is string => !!id);

    const activeManagerId = projectManagerId
      ? await (db ?? this.prisma).user.findFirst({
          where: { id: projectManagerId, isActive: true },
          select: { id: true },
        })
      : null;
    const projectClient = await (db ?? this.prisma).project.findUnique({
      where: { id: projectId },
      select: {
        isArchived: true,
        client: {
          select: { userId: true, user: { select: { isActive: true } } },
        },
      },
    });

    if (projectClient?.isArchived) return [];

    return Array.from(
      new Set(
        [
          activeManagerId?.id,
          projectClient?.client.user?.isActive
            ? projectClient.client.userId
            : null,
          ...memberIds,
          ...assigneeIds,
        ].filter((id): id is string => !!id),
      ),
    );
  }
}
