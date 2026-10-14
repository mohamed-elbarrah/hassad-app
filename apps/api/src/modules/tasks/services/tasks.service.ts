import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  CreateTaskCommentDto,
} from "../dto/task.dto";
import {
  TaskDepartment,
  TaskStatus,
  TaskReviewStage,
  UserRole,
  ProjectStatus,
} from "@hassad/shared";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { FilePurpose, Prisma } from "@prisma/client";
import { StorageService } from "../../../common/storage/storage.service";
import { ProjectGroupChatService } from "../../chat/services/project-group-chat.service";
import { ProjectPeriodsService } from "../../projects/services/project-periods.service";
import { TaskAccessPolicyService, TaskAccessUser } from "./task-access-policy.service";

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
    private projectGroupChatService: ProjectGroupChatService,
    private projectPeriodsService: ProjectPeriodsService,
    private taskAccessPolicy: TaskAccessPolicyService,
  ) {}

  private toUniqueUserIds(
    ...userIds: Array<string | null | undefined>
  ): string[] {
    return Array.from(
      new Set(userIds.filter((value): value is string => !!value)),
    );
  }

  private progressWeightByStatus(
    status: TaskStatus,
    reviewStage: TaskReviewStage,
  ): number {
    if (
      reviewStage === TaskReviewStage.CLIENT_APPROVED ||
      reviewStage === TaskReviewStage.LEGACY_COMPLETED
    )
      return 100;
    if (reviewStage === TaskReviewStage.CLIENT_REVIEW) return 80;
    if (reviewStage === TaskReviewStage.PM_REVIEW) return 70;
    if (reviewStage === TaskReviewStage.CLIENT_REVISION_REQUESTED) return 50;
    if (reviewStage === TaskReviewStage.PM_REVISION_REQUESTED) return 25;
    if (status === TaskStatus.IN_PROGRESS) return 50;
    return 0;
  }

  private async recalculateProjectProgress(
    projectId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const tasks = await db.task.findMany({
      where: { projectId },
      select: { status: true, reviewStage: true },
    });

    const completionPercentage =
      tasks.length === 0
        ? 0
        : Math.round(
            tasks.reduce(
              (sum, task) =>
                sum +
                this.progressWeightByStatus(
                  task.status as TaskStatus,
                  task.reviewStage as TaskReviewStage,
                ),
              0,
            ) / tasks.length,
          );

    const updateData: Record<string, unknown> = { completionPercentage };

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        status: true,
        name: true,
        clientId: true,
        projectManagerId: true,
      },
    });

    if (
      completionPercentage === 100 &&
      project &&
      (project.status === ProjectStatus.ACTIVE ||
        project.status === ProjectStatus.NEEDS_REVISION)
    ) {
      updateData.status = ProjectStatus.AWAITING_REVIEW;

      const client = await db.client.findUnique({
        where: { id: project.clientId },
        select: { userId: true },
      });
      if (client?.userId) {
        this.notificationsService
          .createNotification({
            entityId: projectId,
            entityType: "project",
            eventType: "PROJECT_AWAITING_REVIEW",
            userId: client.userId,
          })
          .catch(() => undefined);
      }
    }

    await db.project.update({
      where: { id: projectId },
      data: updateData,
    });
  }

  private getTaskStatusNotificationConfig(
    status: TaskStatus,
  ): { eventType: string } | undefined {
    switch (status) {
      case TaskStatus.IN_PROGRESS:
        return { eventType: "TASK_STARTED" };
      case TaskStatus.IN_REVIEW:
        return { eventType: "TASK_SUBMITTED" };
      case TaskStatus.DONE:
        return { eventType: "TASK_SUBMITTED_TO_CLIENT" };
      case TaskStatus.REVISION:
        return { eventType: "TASK_REJECTED" };
      default:
        return undefined;
    }
  }

  private mapTaskFile(file: {
    id: string;
    taskId: string;
    uploadedBy: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    purpose: string;
    uploadedAt: Date;
  }) {
    return {
      id: file.id,
      taskId: file.taskId,
      uploadedBy: file.uploadedBy,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.fileType,
      purpose: file.purpose,
      createdAt: file.uploadedAt,
    };
  }

  async searchAssignableUsers(params: {
    dept?: TaskDepartment;
    search?: string;
    limit?: number;
    excludeUserId?: string;
  }) {
    const { dept, excludeUserId } = params;
    const search = params.search?.trim();
    const requestedLimit = Number(params.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
      : 20;

    if (!dept) {
      return {
        items: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      };
    }

    const searchFilter: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const department = await this.prisma.department.findFirst({
      where: { name: dept },
      select: { id: true },
    });
    if (!department) {
      return { items: [], total: 0, page: 1, limit, totalPages: 0 };
    }

    const eligibleRoleFilter: Prisma.UserWhereInput = {
      OR: [
        {
          role: { name: UserRole.TEAM },
          departments: { some: { departmentId: department.id } },
        },
        ...(dept === TaskDepartment.MARKETING
          ? [{ role: { name: UserRole.MARKETING } }]
          : []),
      ],
    };

    const where: Prisma.UserWhereInput = {
      isActive: true,
      id: excludeUserId ? { not: excludeUserId } : undefined,
      AND: [eligibleRoleFilter, searchFilter],
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          role: true,
          departments: { include: { department: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((u) => {
      const deptEntry =
        u.departments.find((entry) => entry.department?.name === dept) ??
        u.departments[0];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        isActive: u.isActive,
        department:
          u.role.name === UserRole.MARKETING
            ? dept
            : (deptEntry?.department?.name ?? null),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return {
      items,
      total,
      page: 1,
      limit,
      totalPages: total === 0 ? 0 : 1,
    };
  }

  async resolveAssignableUser(
    userId: string,
    departmentId: string,
    departmentName?: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        isActive: true,
        role: { select: { name: true } },
        departments: { select: { departmentId: true } },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: "TASK_ASSIGNEE_NOT_FOUND",
        details: {},
      });
    }

    if (!user.isActive) {
      throw new BadRequestException({
        code: "TASK_ASSIGNEE_INACTIVE",
        details: {},
      });
    }

    const assigneeRole = user.role.name as UserRole;

    if (assigneeRole === UserRole.TEAM) {
      const inDepartment = user.departments.some(
        (d) => d.departmentId === departmentId,
      );
      if (!inDepartment) {
        throw new BadRequestException({
          code: "TASK_ASSIGNEE_DEPARTMENT_MISMATCH",
          details: {},
        });
      }
    } else if (assigneeRole === UserRole.MARKETING) {
      const deptName =
        departmentName ??
        (
          await db.department.findUnique({
            where: { id: departmentId },
            select: { name: true },
          })
        )?.name;
      if (deptName !== TaskDepartment.MARKETING) {
        throw new BadRequestException({
          code: "TASK_MARKETING_DEPARTMENT_REQUIRED",
          details: {},
        });
      }
    } else {
      throw new BadRequestException({
        code: "TASK_ASSIGNEE_ROLE_INVALID",
        details: {},
      });
    }

    return user;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const department = await this.prisma.department.findFirst({
      where: { name: dto.dept },
    });
    if (!department) {
      throw new BadRequestException({
        code: "TASK_DEPARTMENT_NOT_FOUND",
        details: {},
      });
    }

    if (dto.assignedTo) {
      await this.resolveAssignableUser(dto.assignedTo, department.id, dto.dept);
    }

    const { dept: _dept, periodId: dtoPeriodId, ...rest } = dto;
    void _dept;

    if (dtoPeriodId) {
      const period = await this.prisma.projectPeriod.findFirst({
        where: { id: dtoPeriodId, projectId: dto.projectId },
        select: { id: true },
      });
      if (!period) {
        throw new BadRequestException({
          code: "TASK_PERIOD_PROJECT_MISMATCH",
          details: {},
        });
      }
    }

    // Auto-link the task to the project's ACTIVE period when not explicitly provided.
    const periodId =
      dtoPeriodId ??
      (await this.projectPeriodsService.getActivePeriodId(dto.projectId));

    const createdTask = await this.prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          ...rest,
          departmentId: department.id,
          periodId: periodId ?? undefined,
          dueDate: new Date(dto.dueDate),
          createdBy: userId,
          status: TaskStatus.TODO,
        },
      });

      await this.recalculateProjectProgress(dto.projectId, tx);

      return createdTask;
    });

    if (createdTask.assignedTo) {
      this.notificationsService
        .createNotification({
          entityId: createdTask.id,
          entityType: "task",
          eventType: "TASK_ASSIGNED",
          userId: createdTask.assignedTo,
          metadata: {
            taskId: createdTask.id,
            projectId: createdTask.projectId,
            assignedBy: userId,
            assigneeDepartment: department.name,
            taskTitle: createdTask.title,
          },
        })
        .catch((err) =>
          this.logger.error(
            `Failed to create TASK_ASSIGNED notification for task=${createdTask.id} assignee=${createdTask.assignedTo}`,
            err,
          ),
        );

      await this.projectGroupChatService
        .syncParticipants(createdTask.projectId)
        .catch(() => undefined);
    }

    return createdTask;
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            clientId: true,
            projectManagerId: true,
            isArchived: true,
            client: {
              select: {
                id: true,
                companyName: true,
                businessType: true,
                userId: true,
              },
            },
            manager: { select: { id: true, name: true } },
          },
        },
        period: { select: { id: true, periodNumber: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        files: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: { select: { name: true } },
              },
            },
          },
        },
        assignmentHistory: {
          orderBy: { createdAt: "asc" },
          include: {
            previousAssignee: { select: { id: true, name: true } },
            newAssignee: { select: { id: true, name: true } },
            changer: { select: { id: true, name: true } },
          },
        },
        statusHistory: {
          include: {
            changer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  private async updateStatus(
    id: string,
    userId: string,
    toStatus: TaskStatus,
    approvedBy?: string,
  ) {
    const task = await this.findOne(id);

    if (toStatus === TaskStatus.DONE || toStatus === TaskStatus.REVISION) {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      });
      const actorRole = actor?.role.name as UserRole | undefined;
      const isAdmin = actorRole === UserRole.ADMIN;
      const isProjectManager =
        actorRole === UserRole.PM && task.project.projectManagerId === userId;
      if (!isAdmin && !isProjectManager) {
        throw new BadRequestException({
          code: "TASK_REVIEW_ACTOR_FORBIDDEN",
          details: {},
        });
      }
    }

    // Workflow enforcement
    if (
      toStatus === TaskStatus.IN_PROGRESS &&
      task.status !== TaskStatus.TODO &&
      task.status !== TaskStatus.REVISION
    ) {
      throw new BadRequestException({
        code: "TASK_STATUS_INVALID_FOR_START",
        details: {},
      });
    }
    if (
      toStatus === TaskStatus.IN_REVIEW &&
      task.status !== TaskStatus.IN_PROGRESS
    ) {
      throw new BadRequestException({
        code: "TASK_STATUS_INVALID_FOR_SUBMIT",
        details: {},
      });
    }
    if (toStatus === TaskStatus.DONE && task.status !== TaskStatus.IN_REVIEW) {
      throw new BadRequestException({
        code: "TASK_STATUS_INVALID_FOR_APPROVE",
        details: {},
      });
    }
    if (
      toStatus === TaskStatus.REVISION &&
      task.status !== TaskStatus.IN_REVIEW
    ) {
      throw new BadRequestException({
        code: "TASK_STATUS_INVALID_FOR_REVISION",
        details: {},
      });
    }

    const persistedStatus =
      toStatus === TaskStatus.DONE ? TaskStatus.CLIENT_REVIEW : toStatus;
    const nextReviewStage =
      toStatus === TaskStatus.IN_REVIEW
        ? TaskReviewStage.PM_REVIEW
        : toStatus === TaskStatus.DONE
          ? TaskReviewStage.CLIENT_REVIEW
          : toStatus === TaskStatus.REVISION
            ? TaskReviewStage.PM_REVISION_REQUESTED
            : toStatus === TaskStatus.IN_PROGRESS
              ? TaskReviewStage.NOT_SUBMITTED
              : task.reviewStage;

    const updatedTask = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          status: persistedStatus,
          reviewStage: nextReviewStage,
          approvedBy: approvedBy || undefined,
          approvedAt: undefined,
          pmAcceptedAt: toStatus === TaskStatus.DONE ? new Date() : undefined,
          // PM acceptance publishes the existing task output for client review.
          isVisibleToClient: toStatus === TaskStatus.DONE ? true : undefined,
          submittedAt:
            toStatus === TaskStatus.IN_REVIEW ? new Date() : undefined,
          startedAt:
            toStatus === TaskStatus.IN_PROGRESS && !task.startedAt
              ? new Date()
              : undefined,
          ...(toStatus === TaskStatus.REVISION
            ? { revisionCount: { increment: 1 } }
            : {}),
        },
      });

      await tx.taskStatusHistory.create({
        data: {
          taskId: id,
          fromStatus: task.status,
          toStatus: persistedStatus,
          changedBy: userId,
        },
      });

      if (task.reviewStage !== nextReviewStage) {
        await tx.taskReviewHistory.create({
          data: {
            taskId: id,
            fromStage: task.reviewStage,
            toStage: nextReviewStage,
            actorId: userId,
            actorType: "STAFF",
          },
        });
      }

      if (toStatus === TaskStatus.IN_REVIEW) {
        await tx.taskRevisionRequest.updateMany({
          where: { taskId: id, status: "OPEN" },
          data: { status: "RESOLVED", resolvedAt: new Date() },
        });
      }

      if (toStatus === TaskStatus.DONE) {
        await tx.taskFile.updateMany({
          where: { taskId: id, purpose: { not: FilePurpose.INTERNAL_DRAFT } },
          data: { purpose: FilePurpose.DELIVERABLE },
        });
        const existing = await tx.deliverable.findFirst({
          where: { taskId: id },
        });
        const submittedFile = task.files.find(
          (file) => file.purpose !== FilePurpose.INTERNAL_DRAFT,
        );
        if (existing) {
          await tx.deliverable.updateMany({
            where: { taskId: id },
            data: {
              periodId: task.periodId,
              status: TaskStatus.IN_REVIEW,
              isVisibleToClient: true,
            },
          });
          if (!existing.filePath && submittedFile) {
            await tx.deliverable.update({
              where: { id: existing.id },
              data: { filePath: submittedFile.filePath },
            });
          }
        } else if (submittedFile) {
          await tx.deliverable.create({
            data: {
              projectId: task.projectId,
              taskId: id,
              periodId: task.periodId,
              title: task.title,
              description: task.description || undefined,
              // Reuse the existing task file; do not upload or duplicate it.
              filePath: submittedFile.filePath,
              status: TaskStatus.IN_REVIEW,
              isVisibleToClient: true,
            },
          });
        }
      }

      await this.recalculateProjectProgress(task.projectId, tx);

      return updated;
    });

    const recipients = this.toUniqueUserIds(
      task.assignedTo,
      task.createdBy,
    ).filter((id) => id !== userId);

    const taskActor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const taskActorName = taskActor?.name ?? "النظام";

    const notificationConfig = this.getTaskStatusNotificationConfig(toStatus);
    if (!notificationConfig) return updatedTask;

    const notificationJobs: Array<Promise<any>> = recipients.map(
      (recipientId) =>
        this.notificationsService.createNotification({
          entityId: id,
          entityType: "task",
          eventType: notificationConfig.eventType,
          userId: recipientId,
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
            changedBy: userId,
            actorName: taskActorName,
            taskTitle: task.title,
            status: toStatus,
          },
        }),
    );

    if (notificationJobs.length > 0) {
      Promise.allSettled(notificationJobs).catch((err) =>
        this.logger.error(
          `Failed to create some status-change notifications for task=${id}`,
          err,
        ),
      );
    }

    if (toStatus === TaskStatus.DONE && task.project.client?.userId) {
      this.notificationsService
        .createNotification({
          entityId: id,
          entityType: "task",
          eventType: "TASK_SUBMITTED_TO_CLIENT",
          userId: task.project.client.userId,
          metadata: {
            taskId: id,
            projectId: task.projectId,
            periodId: task.periodId,
            taskTitle: task.title,
          },
        })
        .catch((error) =>
          this.logger.warn(
            `Failed to notify client about task=${id}: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
    }

    return updatedTask;
  }

  async assign(id: string, userId: string, dto: AssignTaskDto) {
    const assignment = await this.prisma.$transaction(async (tx) => {
      const existingTask = await tx.task.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          projectId: true,
          departmentId: true,
          department: { select: { name: true } },
          assignedTo: true,
          createdBy: true,
          project: {
            select: { projectManagerId: true, isArchived: true },
          },
          assignee: { select: { id: true, name: true } },
        },
      });
      if (!existingTask) {
        throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
      }

      const assigneeInfo = await this.resolveAssignableUser(
        dto.userId,
        existingTask.departmentId,
        existingTask.department.name,
        tx,
      );

      if (dto.userId === existingTask.assignedTo) {
        const unchangedTask = await tx.task.findUnique({ where: { id } });
        return {
          existingTask,
          assigneeInfo,
          updatedTask: unchangedTask,
          changed: false,
          chatParticipantRemovals: [],
          notificationPayloads: [],
        };
      }

      const update = await tx.task.updateMany({
        where: { id, assignedTo: existingTask.assignedTo },
        data: { assignedTo: dto.userId },
      });
      if (update.count !== 1) {
        throw new ConflictException({
          code: "TASK_ASSIGNMENT_CONFLICT",
          details: {},
        });
      }

      await tx.taskAssignmentHistory.create({
        data: {
          taskId: id,
          previousAssigneeId: existingTask.assignedTo,
          newAssigneeId: dto.userId,
          changedBy: userId,
        },
      });

      const chatParticipantRemovals = existingTask.project.isArchived
        ? []
        : await this.projectGroupChatService.syncParticipantsForTaskReassignment(
            existingTask.projectId,
            existingTask.assignedTo,
            tx,
          );

      let notificationPayloads;
      if (existingTask.assignedTo) {
        const actor = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        notificationPayloads =
          await this.notificationsService.createTaskReassignmentNotifications(
            tx,
            {
              taskId: existingTask.id,
              projectId: existingTask.projectId,
              taskTitle: existingTask.title,
              previousAssignee: existingTask.assignee,
              newAssignee: { id: dto.userId, name: assigneeInfo.name },
              projectManagerId: existingTask.project.projectManagerId,
              taskCreatorId: existingTask.createdBy,
              actorId: userId,
              actorName: actor?.name,
            },
          );
      } else {
        const recipients = this.toUniqueUserIds(
          dto.userId,
          existingTask.createdBy,
        );
        notificationPayloads = [];
        for (const recipientId of recipients) {
          notificationPayloads.push(
            await this.notificationsService.createNotificationInTransaction(
              tx,
              {
                entityId: existingTask.id,
                entityType: "task",
                eventType: "TASK_ASSIGNED",
                userId: recipientId,
                metadata: {
                  taskId: existingTask.id,
                  projectId: existingTask.projectId,
                  assignedBy: userId,
                  assigneeDepartment: existingTask.department.name,
                  taskTitle: existingTask.title,
                  assigneeName: assigneeInfo.name,
                },
              },
            ),
          );
        }
      }

      const updatedTask = await tx.task.findUnique({ where: { id } });
      return {
        existingTask,
        assigneeInfo,
        updatedTask,
        changed: true,
        chatParticipantRemovals,
        notificationPayloads,
      };
    });

    const { existingTask, updatedTask } = assignment;
    if (!updatedTask) {
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
    }

    if (assignment.changed) {
      try {
        await this.projectGroupChatService.publishParticipantRemovals(
          existingTask.projectId,
          assignment.chatParticipantRemovals,
        );
      } catch (error) {
        this.logger.error(
          `Failed to evict task participant from project chat for task=${existingTask.id}`,
          error,
        );
      }

      const publishResults = await Promise.allSettled(
        assignment.notificationPayloads.map((payload) =>
          this.notificationsService.publishPersistedNotification(payload),
        ),
      );
      publishResults.forEach((result) => {
        if (result.status === "rejected") {
          this.logger.error(
            `Task assignment notification publish failed for task=${existingTask.id}`,
            result.reason,
          );
        }
      });
    }

    return updatedTask;
  }

  async start(id: string, userId: string) {
    return this.updateStatus(id, userId, TaskStatus.IN_PROGRESS);
  }

  async submit(id: string, userId: string) {
    return this.updateStatus(id, userId, TaskStatus.IN_REVIEW);
  }

  async approve(id: string, userId: string) {
    return this.updateStatus(id, userId, TaskStatus.DONE, userId);
  }

  async reject(id: string, userId: string) {
    return this.updateStatus(id, userId, TaskStatus.REVISION);
  }

  async changeStatus(id: string, userId: string, toStatus: TaskStatus) {
    const validStatuses = Object.values(TaskStatus);
    if (!validStatuses.includes(toStatus)) {
      throw new BadRequestException({
        code: "TASK_STATUS_INVALID",
        details: {},
      });
    }

    switch (toStatus) {
      case TaskStatus.TODO:
        throw new BadRequestException({
          code: "TASK_STATUS_INVALID_FOR_TODO",
          details: {},
        });
      case TaskStatus.IN_PROGRESS:
        return this.start(id, userId);
      case TaskStatus.IN_REVIEW:
        return this.submit(id, userId);
      case TaskStatus.DONE:
        return this.approve(id, userId);
      case TaskStatus.REVISION:
        return this.reject(id, userId);
      default:
        throw new BadRequestException({
          code: "TASK_STATUS_UNHANDLED",
          details: {},
        });
    }
  }

  async addFile(
    id: string,
    userId: string,
    fileData: {
      key: string;
      originalName: string;
      mimeType: string;
      size: number;
      purpose?: string;
    },
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
    }

    const createdFile = await this.prisma.taskFile.create({
      data: {
        taskId: id,
        uploadedBy: userId,
        filePath: fileData.key,
        fileName: fileData.originalName,
        fileType: fileData.mimeType,
        fileSize: fileData.size,
        purpose: (fileData.purpose ?? FilePurpose.REFERENCE) as FilePurpose,
      },
    });

    return this.mapTaskFileWithUrl(createdFile);
  }

  async getFiles(id: string) {
    const files = await this.prisma.taskFile.findMany({
      where: { taskId: id },
      orderBy: { uploadedAt: "desc" },
    });

    const keys = files.map((file) => file.filePath);
    const urlMap = await this.storageService.getMultiplePresignedUrls(keys);

    return files.map((file) => ({
      ...this.mapTaskFile(file),
      url: urlMap.get(file.filePath) || null,
    }));
  }

  async getAuthorizedDownloadUrl(
    taskId: string,
    fileId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<string> {
    let taskWhere: Prisma.TaskWhereInput;
    switch (userRole) {
      case UserRole.ADMIN:
        taskWhere = { id: taskId };
        break;
      case UserRole.PM:
        taskWhere = {
          id: taskId,
          archivedAt: null,
          project: { projectManagerId: userId },
        };
        break;
      case UserRole.TEAM:
        taskWhere = { id: taskId, archivedAt: null, assignedTo: userId };
        break;
      case UserRole.MARKETING:
        taskWhere = {
          id: taskId,
          archivedAt: null,
          assignedTo: userId,
          department: { name: TaskDepartment.MARKETING },
        };
        break;
      default:
        throw new NotFoundException({
          code: "TASK_NOT_FOUND",
          details: { taskId },
        });
    }

    const task = await this.prisma.task.findFirst({
      where: taskWhere,
      select: { id: true },
    });
    if (!task) {
      throw new NotFoundException({
        code: "TASK_NOT_FOUND",
        details: { taskId },
      });
    }

    return this.getDownloadUrl(taskId, fileId);
  }

  async getDownloadUrl(taskId: string, fileId: string): Promise<string> {
    const file = await this.prisma.taskFile.findFirst({
      where: { id: fileId, taskId },
      select: { filePath: true },
    });

    if (!file) {
      throw new NotFoundException({ code: "TASK_FILE_NOT_FOUND", details: {} });
    }

    return this.storageService.getPresignedUrl(file.filePath);
  }

  async deleteFile(taskId: string, fileId: string) {
    const file = await this.prisma.taskFile.findFirst({
      where: { id: fileId, taskId },
    });

    if (!file) {
      throw new NotFoundException({ code: "TASK_FILE_NOT_FOUND", details: {} });
    }

    const publishedDeliverable = await this.prisma.deliverable.findFirst({
      where: { taskId, filePath: file.filePath, isVisibleToClient: true },
      select: { id: true },
    });
    if (publishedDeliverable) {
      throw new BadRequestException({
        code: "TASK_FILE_PUBLISHED_TO_CLIENT",
        details: {},
      });
    }

    await this.storageService.deleteByKey(file.filePath).catch(() => {});

    return this.prisma.taskFile.delete({
      where: { id: fileId, taskId },
    });
  }

  async addComment(id: string, userId: string, dto: CreateTaskCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true, assignedTo: true, createdBy: true },
    });

    if (!task) {
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId: id,
        userId,
        content: dto.content,
        isInternal: false,
      },
    });

    const recipients = this.toUniqueUserIds(
      task.assignedTo,
      task.createdBy,
    ).filter((recipientId) => recipientId !== userId);

    if (recipients.length > 0) {
      const notificationJobs = recipients.map((recipientId) =>
        this.notificationsService.createNotification({
          entityId: task.id,
          entityType: "task",
          eventType: "TASK_COMMENT_ADDED",
          userId: recipientId,
          metadata: {
            taskId: task.id,
            commentId: comment.id,
            commentedBy: userId,
          },
        }),
      );

      Promise.allSettled(notificationJobs).catch((err) =>
        this.logger.error(
          `Failed to create some TASK_COMMENT_ADDED notifications for task=${task.id}`,
          err,
        ),
      );
    }

    return comment;
  }

  async findByProject(projectId: string, user: TaskAccessUser) {
    const scope = await this.taskAccessPolicy.getProjectTaskReadScope(
      projectId,
      user,
    );
    if (scope.canViewAllTasks) {
      return this.prisma.task.findMany({
        where: scope.taskWhere,
        include: {
          assignee: { select: { id: true, name: true } },
          files: {
            include: {
              uploader: { select: { id: true, name: true } },
            },
          },
          comments: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
          assignmentHistory: {
            orderBy: { createdAt: "asc" },
            include: {
              previousAssignee: { select: { id: true, name: true } },
              newAssignee: { select: { id: true, name: true } },
              changer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const tasks = await this.prisma.task.findMany({
      where: scope.taskWhere,
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
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((task) => ({
      ...task,
      assignmentAccess:
        task.assignedTo === user.id ? ("CURRENT" as const) : ("FORMER" as const),
    }));
  }

  async findPmTasks(
    userId: string,
    filters: {
      status?: string;
      priority?: string;
      projectId?: string;
      dept?: string;
      deptName?: string;
      dueBefore?: string;
      dueAfter?: string;
    },
  ) {
    const where: Record<string, unknown> = {
      project: { projectManagerId: userId },
    };
    if (filters.status) where["status"] = filters.status;
    if (filters.priority) where["priority"] = filters.priority;
    if (filters.projectId) where["projectId"] = filters.projectId;
    if (filters.dept) where["departmentId"] = filters.dept;
    if (filters.deptName) {
      where["department"] = { name: filters.deptName };
    }

    if (filters.dueBefore || filters.dueAfter) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueBefore) dueDateFilter["lte"] = new Date(filters.dueBefore);
      if (filters.dueAfter) dueDateFilter["gte"] = new Date(filters.dueAfter);
      where["dueDate"] = dueDateFilter;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientId: true,
            status: true,
            client: {
              select: {
                companyName: true,
                businessType: true,
              },
            },
          },
        },
        assignee: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        period: { select: { periodNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async pmStats(userId: string) {
    // Get all project IDs where this user is the project manager
    const pmProjects = await this.prisma.project.findMany({
      where: { projectManagerId: userId },
      select: { id: true },
    });
    const projectIds = pmProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0,
        overdue: 0,
        projects: projectIds.length,
      };
    }

    const whereInPmProjects = { projectId: { in: projectIds } };

    const [grouped, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ["status"],
        where: whereInPmProjects,
        _count: { status: true },
      }),
      this.prisma.task.count({
        where: {
          ...whereInPmProjects,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
    ]);

    const counts: Record<string, number> = {};
    for (const g of grouped) {
      counts[g.status] = g._count.status;
    }

    const total = grouped.reduce((sum, g) => sum + g._count.status, 0);

    return {
      total,
      todo: counts[TaskStatus.TODO] ?? 0,
      inProgress: counts[TaskStatus.IN_PROGRESS] ?? 0,
      inReview:
        (counts[TaskStatus.IN_REVIEW] ?? 0) +
        (counts[TaskStatus.CLIENT_REVIEW] ?? 0),
      done: counts[TaskStatus.DONE] ?? 0,
      overdue,
      projects: projectIds.length,
    };
  }

  async findMine(
    userId: string,
    filters: {
      status?: string;
      priority?: string;
      projectId?: string;
      dept?: string;
      deptName?: string;
      dueBefore?: string;
      dueAfter?: string;
    },
    includeCampaigns: boolean = false,
  ) {
    const where: Record<string, unknown> = {
      assignedTo: userId,
      archivedAt: null,
    };
    if (filters.status) where["status"] = filters.status;
    if (filters.priority) where["priority"] = filters.priority;
    if (filters.dept) where["departmentId"] = filters.dept;
    if (filters.deptName) {
      where["department"] = { name: filters.deptName };
    }

    if (filters.dueBefore || filters.dueAfter) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueBefore) dueDateFilter["lte"] = new Date(filters.dueBefore);
      if (filters.dueAfter) dueDateFilter["gte"] = new Date(filters.dueAfter);
      where["dueDate"] = dueDateFilter;
    }

    const include: any = {
      project: {
        select: {
          id: true,
          name: true,
          clientId: true,
          client: {
            select: {
              companyName: true,
              businessType: true,
            },
          },
        },
      },
      assignee: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      period: { select: { id: true, periodNumber: true } },
    };

    if (includeCampaigns) {
      include.campaigns = {
        where: { isArchived: false },
        include: {
          kpiSnapshots: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      };
    }

    return this.prisma.task.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });
  }

  async myStats(userId: string) {
    const [grouped, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ["status"],
        where: { assignedTo: userId, archivedAt: null },
        _count: { status: true },
      }),
      this.prisma.task.count({
        where: {
          assignedTo: userId,
          archivedAt: null,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
    ]);

    const counts: Record<string, number> = {};
    for (const g of grouped) {
      counts[g.status] = g._count.status;
    }

    const total = grouped.reduce((sum, g) => sum + g._count.status, 0);

    return {
      total,
      todo: counts[TaskStatus.TODO] ?? 0,
      inProgress: counts[TaskStatus.IN_PROGRESS] ?? 0,
      inReview: counts[TaskStatus.IN_REVIEW] ?? 0,
      blocked: counts["BLOCKED"] ?? 0,
      done: counts[TaskStatus.DONE] ?? 0,
      overdue,
    };
  }

  async getComments(taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId, isInternal: false },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existingTask = await tx.task.findUnique({
        where: { id },
        select: { id: true, projectId: true },
      });

      if (!existingTask) {
        throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
      }

      const deletedTask = await tx.task.delete({ where: { id } });
      await this.recalculateProjectProgress(existingTask.projectId, tx);

      return deletedTask;
    });
  }

  private mapTaskFileWithUrl(file: {
    id: string;
    taskId: string;
    uploadedBy: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    purpose: string;
    uploadedAt: Date;
  }) {
    return {
      id: file.id,
      taskId: file.taskId,
      uploadedBy: file.uploadedBy,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.fileType,
      purpose: file.purpose,
      createdAt: file.uploadedAt,
    };
  }

  async toggleArchive(
    taskId: string,
  ): Promise<{ code: string; archived: boolean }> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
    }

    const isArchived = task.archivedAt !== null;
    await this.prisma.task.update({
      where: { id: taskId },
      data: { archivedAt: isArchived ? null : new Date() },
    });

    return {
      code: isArchived ? "TASK_UNARCHIVED" : "TASK_ARCHIVED",
      archived: !isArchived,
    };
  }
}
