import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Project, Task, User, Prisma, ProjectStatus } from "@prisma/client";
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
} from "../dto/project.dto";
import {
  ContractStatus,
  TaskStatus,
  TaskPriority,
  UserRole,
  ClientKind,
} from "@hassad/shared";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { StorageService } from "../../../common/storage/storage.service";
import { ClientCounterService } from "../../crm/services/client-counter.service";
import { ProjectGroupChatService } from "../../chat/services/project-group-chat.service";
import { TaskAccessPolicyService } from "../../tasks/services/task-access-policy.service";

type TransactionClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
    private clientCounterService: ClientCounterService,
    private projectGroupChatService: ProjectGroupChatService,
    private taskAccessPolicy: TaskAccessPolicyService,
  ) {}

  async create(dto: CreateProjectDto) {
    if (!dto.contractId) {
      throw new BadRequestException({
        code: "PROJECT_SIGNED_CONTRACT_REQUIRED",
        details: {},
      });
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });

    if (!contract) {
      throw new NotFoundException({
        code: "CONTRACT_NOT_FOUND",
        details: { contractId: dto.contractId },
      });
    }

    if (
      contract.status !== ContractStatus.SIGNED &&
      contract.status !== ContractStatus.ACTIVE
    ) {
      throw new BadRequestException({
        code: "PROJECT_CONTRACT_STATUS_INVALID",
        details: { currentStatus: contract.status },
      });
    }

    const createdProject = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ...dto,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
      });

      await this.promoteClientForProject(project.clientId, project.status, tx);
      return project;
    });
    this.clientCounterService
      .onProjectStatusChange(createdProject.id)
      .catch(() => undefined);

    this.projectGroupChatService
      .ensure(createdProject.id)
      .catch(() => undefined);

    return createdProject;
  }

  async findOne(id: string, userId: string, role: UserRole | string) {
    const scope = await this.taskAccessPolicy.getProjectTaskReadScope(id, {
      id: userId,
      role,
    });

    if (!scope.canViewAllTasks) {
      const project = await this.prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
          clientId: true,
          projectManagerId: true,
          createdAt: true,
          client: { select: { id: true, companyName: true } },
          manager: { select: { id: true, name: true } },
          members: {
            where: { userId },
            select: {
              userId: true,
              role: true,
              joinedAt: true,
              user: { select: { id: true, name: true } },
            },
          },
          tasks: {
            where: scope.taskRelationWhere,
            include: {
              assignee: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
              files: {
                select: {
                  id: true,
                  taskId: true,
                  uploadedBy: true,
                  fileName: true,
                  fileType: true,
                  fileSize: true,
                  purpose: true,
                  uploadedAt: true,
                },
              },
              comments: {
                where: { isInternal: false },
                include: { user: { select: { id: true, name: true } } },
              },
              assignmentHistory: {
                where: scope.assignmentHistoryWhere,
                orderBy: { createdAt: "asc" },
                include: {
                  previousAssignee: { select: { id: true, name: true } },
                  newAssignee: { select: { id: true, name: true } },
                  changer: { select: { id: true, name: true } },
                },
              },
              statusHistory: {
                include: { changer: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });
      if (!project)
        throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

      return {
        ...project,
        tasks: project.tasks.map((task) => ({
          ...task,
          assignmentAccess:
            task.assignedTo === userId
              ? ("CURRENT" as const)
              : ("FORMER" as const),
        })),
      };
    }

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        manager: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: true,
        contract: {
          select: {
            id: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            numberOfMonths: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId: id },
      });
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    const updated = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id },
        data,
      });
      await this.promoteClientForProject(project.clientId, project.status, tx);
      return project;
    });
    this.clientCounterService.onProjectStatusChange(id).catch(() => undefined);
    // Also refresh the title when a project is renamed and add any newly
    // eligible manager/member/assignee participants.
    this.projectGroupChatService
      .syncParticipants(id)
      .catch(() => undefined);
    return updated;
  }

  async archive(id: string) {
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    this.clientCounterService.onProjectStatusChange(id).catch(() => undefined);
    this.projectGroupChatService
      .syncParticipants(id)
      .catch(() => undefined);

    return updated;
  }

  async addMember(id: string, dto: AddMemberDto, addedBy: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project)
      throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

    const member = await this.prisma.projectMember.create({
      data: {
        projectId: id,
        userId: dto.userId,
        role: dto.role,
      },
    });

    this.projectGroupChatService
      .syncParticipants(id)
      .catch(() => undefined);

    // Auto-create task for Marketing role
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { role: true },
    });

    if (user?.role.name === UserRole.MARKETING) {
      const marketingDept = await this.prisma.department.findUnique({
        where: { name: "MARKETING" },
      });

      if (marketingDept) {
        const task = await this.prisma.task.create({
          data: {
            projectId: id,
            departmentId: marketingDept.id,
            assignedTo: dto.userId,
            createdBy: addedBy,
            title: "إدارة الحملات الإعلانية",
            description: `تم إنشاء هذه المهمة تلقائياً عند إسناد المشروع إلى قسم التسويق. يرجى البدء في إعداد الحملات الإعلانية للمشروع: ${project.name}`,
            status: TaskStatus.TODO,
            priority: TaskPriority.NORMAL,
            dueDate: project.endDate,
          },
        });

        this.projectGroupChatService
          .addParticipant(id, dto.userId)
          .catch(() => undefined);

        // Notify marketer
        this.notificationsService
          .createNotification({
            entityId: task.id,
            entityType: "task",
            eventType: "TASK_ASSIGNED",
            userId: dto.userId,
            metadata: {
              taskId: task.id,
              projectId: project.id,
              assignedBy: addedBy,
              taskTitle: task.title,
              projectName: project.name,
            },
          })
          .catch(() => undefined);
      }
    }

    return member;
  }

  async removeMember(id: string, userId: string) {
    const result = await this.prisma.projectMember.deleteMany({
      where: {
        projectId: id,
        userId: userId,
      },
    });

    this.projectGroupChatService
      .syncParticipants(id)
      .catch(() => undefined);

    return result;
  }

  async findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    clientId?: string;
    projectManagerId?: string;
  }) {
    const page = filters.page ? Number(filters.page) : 1;
    const limit = filters.limit ? Number(filters.limit) : 20;

    const where: Record<string, unknown> = {};
    if (filters.status) where["status"] = filters.status;
    if (filters.search)
      where["name"] = { contains: filters.search, mode: "insensitive" };
    if (filters.clientId) where["clientId"] = filters.clientId;
    if (filters.projectManagerId)
      where["projectManagerId"] = filters.projectManagerId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          manager: { select: { id: true, name: true } },
          members: { select: { id: true, userId: true } },
          tasks: { select: { id: true, status: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async promoteClientForProject(
    clientId: string,
    status: ProjectStatus,
    db: TransactionClient = this.prisma,
  ) {
    if (status !== ProjectStatus.ACTIVE && status !== ProjectStatus.COMPLETED) {
      return;
    }

    await db.client.update({
      where: { id: clientId },
      data: { kind: ClientKind.CLIENT },
    });
  }

  async updateStatus(id: string, status: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        clientId: true,
        projectManagerId: true,
      },
    });
    if (!project)
      throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

    const updated = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id },
        data: { status: status as ProjectStatus },
      });
      await this.promoteClientForProject(project.clientId, project.status, tx);
      return project;
    });
    this.clientCounterService.onProjectStatusChange(id).catch(() => undefined);

    let actorName: string | undefined;
    if (userId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      actorName = actor?.name;
    }

    const memberIds = await this.prisma.projectMember.findMany({
      where: { projectId: id },
      select: { userId: true },
    });
    const recipientIds = [
      ...memberIds.map((m) => m.userId),
      project.projectManagerId,
    ].filter(Boolean) as string[];

    if (recipientIds.length > 0) {
      await this.notificationsService.notifyUsers({
        userIds: recipientIds,
        entityId: id,
        entityType: "project",
        eventType: "PROJECT_STATUS_CHANGED",
        metadata: { projectId: id, projectName: project.name, status, actorName },
      });
    }

    const clientUser = await this.prisma.client.findUnique({
      where: { id: project.clientId },
      select: { userId: true },
    });
    if (clientUser?.userId) {
      this.notificationsService
        .createNotification({
          entityId: id,
          entityType: "project",
          eventType: "PROJECT_STATUS_CHANGED",
          userId: clientUser.userId,
          metadata: { projectId: id, projectName: project.name, status, actorName },
        })
        .catch(() => undefined);
    }

    return updated;
  }

  async uploadFile(
    projectId: string,
    userId: string,
    fileData: {
      key: string;
      originalName: string;
      mimeType: string;
      size: number;
    },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project)
      throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

    return this.prisma.projectFile.create({
      data: {
        projectId,
        uploadedBy: userId,
        fileName: fileData.originalName,
        filePath: fileData.key,
        fileType: fileData.mimeType,
        fileSize: fileData.size,
      },
    });
  }

  async getFiles(projectId: string) {
    const files = await this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });

    const urlMap = await this.storageService.getMultiplePresignedUrls(
      files.map((f) => f.filePath),
    );

    return files.map((f) => ({
      ...f,
      url: urlMap.get(f.filePath) || null,
    }));
  }

  async deleteFile(projectId: string, fileId: string) {
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, projectId },
    });
    if (!file)
      throw new NotFoundException({ code: "PROJECT_FILE_NOT_FOUND", details: {} });

    await this.storageService.deleteByKey(file.filePath);
    await this.prisma.projectFile.delete({ where: { id: fileId } });
    return { success: true };
  }

  /**
   * Get all revision requests across all projects managed by a given PM.
   * Returns deliverables that have at least one revision request,
   * grouped by project.
   */
  async findPmRevisions(userId: string) {
    // Get all project IDs managed by this PM
    const pmProjects = await this.prisma.project.findMany({
      where: { projectManagerId: userId },
      select: { id: true },
    });
    const projectIds = pmProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    // Get all deliverables with revision requests in those projects
    const deliverables = await this.prisma.deliverable.findMany({
      where: {
        projectId: { in: projectIds },
        revisionRequests: { some: {} },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        revisionRequests: {
          include: {
            client: {
              select: { id: true, companyName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return deliverables;
  }

  // ─── Project Manager Change ──────────────────────────────────────────────────

  /**
   * Change the project manager for a project.
   * Handles project update, chat sync, and optional task reassignment.
   *
   * @param projectId - The project ID
   * @param newPmId - The new project manager's user ID
   * @param options - Configuration options
   * @param db - Optional transaction client for atomic operations
   */
  async changeProjectManager(
    projectId: string,
    newPmId: string,
    options: {
      reason: string;
      keepOldPmInChat?: boolean;
      reassignTasks?: boolean;
    },
    db?: TransactionClient,
  ): Promise<{
    project: Project;
    oldPmId: string | null;
    newPm: User;
    reassignedTasks: Task[];
  }> {
    const { keepOldPmInChat = false, reassignTasks = true } = options;
    const client = db ?? this.prisma;

    // Get project with current PM
    const project = await client.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        projectManagerId: true,
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId },
      });
    }

    // Verify new PM exists and has PM role
    const newPm = await client.user.findFirst({
      where: {
        id: newPmId,
        isActive: true,
        role: { name: "PM" },
      },
    });

    if (!newPm) {
      throw new NotFoundException({
        code: "PROJECT_MANAGER_NOT_ELIGIBLE",
        details: { userId: newPmId },
      });
    }

    // Check if PM is already the same
    if (project.projectManagerId === newPmId) {
      throw new BadRequestException({
        code: "PROJECT_MANAGER_ALREADY_ASSIGNED",
        details: { userId: newPmId },
      });
    }

    const oldPmId = project.projectManagerId;

    // Update project's PM
    const updatedProject = await client.project.update({
      where: { id: projectId },
      data: { projectManagerId: newPmId },
    });

    // Handle task reassignment (only tasks assigned to old PM)
    let reassignedTasks: Task[] = [];
    if (reassignTasks && oldPmId) {
      const tasksToUpdate = await client.task.findMany({
        where: {
          projectId,
          assignedTo: oldPmId,
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        },
      });

      if (tasksToUpdate.length > 0) {
        await client.task.updateMany({
          where: {
            id: { in: tasksToUpdate.map((t) => t.id) },
          },
          data: { assignedTo: newPmId },
        });
        reassignedTasks = tasksToUpdate;
      }
    }

    // Sync project group chat
    // Add new PM to chat
    await this.projectGroupChatService.addParticipant(projectId, newPmId, db);

    await this.projectGroupChatService.syncParticipants(projectId, db);

    // This is an explicit caller-controlled removal, not synchronization;
    // preserve the existing keepOldPmInChat contract.
    if (oldPmId && !keepOldPmInChat) {
      const conversation = await this.projectGroupChatService.find(
        projectId,
        db,
      );
      if (conversation) {
        await client.conversationParticipant.deleteMany({
          where: { conversationId: conversation.id, userId: oldPmId },
        });
      }
    }

    return {
      project: updatedProject,
      oldPmId,
      newPm,
      reassignedTasks,
    };
  }
}
