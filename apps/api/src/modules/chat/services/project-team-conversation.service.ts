import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConversationType, Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ProjectTeamConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureTeamConversation(projectId: string, db?: DbClient) {
    const existing = await this.findTeamConversation(projectId, db);
    if (existing) return existing;

    const project = await (db ?? this.prisma).project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        clientId: true,
        projectManagerId: true,
      },
    });

    if (!project) return null;

    const memberIds = await this.collectProjectMemberUserIds(
      projectId,
      project.projectManagerId,
      db,
    );

    if (memberIds.length === 0) return null;

    return (db ?? this.prisma).conversation.create({
      data: {
        type: ConversationType.TEAM,
        clientId: project.clientId,
        projectId: project.id,
        title: `فريق مشروع ${project.name}`,
        participants: {
          create: memberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        client: true,
        participants: { include: { user: true } },
      },
    });
  }

  /**
   * Ensures a specific user is a participant in the project's team chat.
   * Creates the team chat if it does not exist, guaranteeing the provided
   * userId is included even if no other members are present yet.
   */
  async ensureParticipantInProjectTeam(
    projectId: string,
    userId: string,
    db?: DbClient,
  ) {
    let conversation = await this.findTeamConversation(projectId, db);

    if (!conversation) {
      const project = await (db ?? this.prisma).project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          clientId: true,
          projectManagerId: true,
        },
      });

      if (!project) return null;

      const baseMemberIds = await this.collectProjectMemberUserIds(
        projectId,
        project.projectManagerId,
        db,
      );
      const participantIds = Array.from(new Set([...baseMemberIds, userId]));

      conversation = await (db ?? this.prisma).conversation.create({
        data: {
          type: ConversationType.TEAM,
          clientId: project.clientId,
          projectId: project.id,
          title: `فريق مشروع ${project.name}`,
          participants: {
            create: participantIds.map((id) => ({ userId: id })),
          },
        },
        include: {
          client: true,
          participants: { include: { user: true } },
        },
      });

      return conversation;
    }

    const exists = await (db ?? this.prisma).conversationParticipant.findFirst({
      where: { conversationId: conversation.id, userId },
    });

    if (exists) return conversation;

    await (db ?? this.prisma).conversationParticipant.create({
      data: { conversationId: conversation.id, userId },
    });

    return this.findTeamConversation(projectId, db);
  }

  async syncParticipants(projectId: string, db?: DbClient) {
    const project = await (db ?? this.prisma).project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectManagerId: true,
      },
    });

    if (!project) return;

    const conversation = await this.ensureTeamConversation(projectId, db);
    if (!conversation) return;

    const expectedUserIds = await this.collectProjectMemberUserIds(
      projectId,
      project.projectManagerId,
      db,
    );

    const currentParticipants = await (
      db ?? this.prisma
    ).conversationParticipant.findMany({
      where: { conversationId: conversation.id },
      select: { id: true, userId: true },
    });

    const currentUserIds = currentParticipants.map((p) => p.userId);

    const missingUserIds = expectedUserIds.filter(
      (id) => !currentUserIds.includes(id),
    );
    const staleParticipantIds = currentParticipants
      .filter((p) => !expectedUserIds.includes(p.userId))
      .map((p) => p.id);

    if (missingUserIds.length > 0) {
      await (db ?? this.prisma).conversationParticipant.createMany({
        data: missingUserIds.map((userId) => ({
          conversationId: conversation.id,
          userId,
        })),
      });
    }

    if (staleParticipantIds.length > 0) {
      await (db ?? this.prisma).conversationParticipant.deleteMany({
        where: { id: { in: staleParticipantIds } },
      });
    }

    return this.findTeamConversation(projectId, db);
  }

  async removeParticipant(projectId: string, userId: string, db?: DbClient) {
    const conversation = await this.findTeamConversation(projectId, db);
    if (!conversation) return null;

    await (db ?? this.prisma).conversationParticipant.deleteMany({
      where: { conversationId: conversation.id, userId },
    });

    return this.findTeamConversation(projectId, db);
  }

  async findTeamConversation(projectId: string, db?: DbClient) {
    return (db ?? this.prisma).conversation.findUnique({
      where: { projectId },
      include: {
        client: true,
        participants: { include: { user: true } },
      },
    });
  }

  private async collectProjectMemberUserIds(
    projectId: string,
    projectManagerId: string | null,
    db?: DbClient,
  ): Promise<string[]> {
    const memberUserIds = (
      await (db ?? this.prisma).projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      })
    ).map((m) => m.userId);

    const assigneeUserIds = (
      await (db ?? this.prisma).task.findMany({
        where: { projectId, assignedTo: { not: null } },
        select: { assignedTo: true },
      })
    )
      .map((t) => t.assignedTo)
      .filter((id): id is string => !!id);

    return Array.from(
      new Set(
        [projectManagerId, ...memberUserIds, ...assigneeUserIds].filter(
          (id): id is string => !!id,
        ),
      ),
    );
  }
}
