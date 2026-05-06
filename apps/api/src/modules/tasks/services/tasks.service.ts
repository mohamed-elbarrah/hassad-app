import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  UploadTaskFileDto,
  CreateTaskCommentDto,
} from "../dto/task.dto";
import { TaskDepartment, TaskStatus, UserRole } from "@hassad/shared";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { FilePurpose, Prisma } from "@prisma/client";
import { createReadStream, existsSync, ReadStream } from "fs";
import { join } from "path";

const DEPARTMENT_ARABIC_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "التصميم",
  [TaskDepartment.CONTENT]: "المحتوى",
  [TaskDepartment.DEVELOPMENT]: "التطوير",
  [TaskDepartment.MARKETING]: "التسويق",
  [TaskDepartment.PRODUCTION]: "المونتاج",
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private getDepartmentArabicLabel(departmentName: string | null | undefined) {
    if (!departmentName) return null;
    return DEPARTMENT_ARABIC_LABELS[departmentName as TaskDepartment] ?? null;
  }

  private toUniqueUserIds(
    ...userIds: Array<string | null | undefined>
  ): string[] {
    return Array.from(
      new Set(userIds.filter((value): value is string => !!value)),
    );
  }

  private progressWeightByStatus(status: TaskStatus): number {
    if (status === TaskStatus.DONE) return 100;
    if (status === TaskStatus.IN_REVIEW) return 80;
    if (status === TaskStatus.IN_PROGRESS) return 50;
    if (status === TaskStatus.REVISION) return 25;
    return 0;
  }

  private async recalculateProjectProgress(
    projectId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const tasks = await db.task.findMany({
      where: { projectId },
      select: { status: true },
    });

    const completionPercentage =
      tasks.length === 0
        ? 0
        : Math.round(
            tasks.reduce(
              (sum, task) =>
                sum + this.progressWeightByStatus(task.status as TaskStatus),
              0,
            ) / tasks.length,
          );

    await db.project.update({
      where: { id: projectId },
      data: { completionPercentage },
    });
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
  }) {
    const { dept, search, limit = 20 } = params;

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

    const roleAndDeptFilter: Prisma.UserWhereInput =
      dept === TaskDepartment.MARKETING
        ? { role: { name: { in: [UserRole.EMPLOYEE, UserRole.MARKETING] } } }
        : {
            role: { name: UserRole.EMPLOYEE },
            departments: {
              some: {
                department: { name: dept },
              },
            },
          };

    const where: Prisma.UserWhereInput = {
      isActive: true,
      AND: [roleAndDeptFilter, searchFilter],
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
        department: deptEntry?.department?.name ?? null,
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

  private async resolveAssignableUser(userId: string, departmentId: string, departmentName?: string) {
    const user = await this.prisma.user.findUnique({
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
      throw new NotFoundException(`Assignee with ID ${userId} not found`);
    }

    if (!user.isActive) {
      throw new BadRequestException("Cannot assign task to an inactive user");
    }

    const assigneeRole = user.role.name as UserRole;

    if (assigneeRole === UserRole.EMPLOYEE) {
      const inDepartment = user.departments.some(
        (d) => d.departmentId === departmentId,
      );
      if (!inDepartment) {
        throw new BadRequestException(
          "Assignee does not belong to the selected department",
        );
      }
    } else if (assigneeRole === UserRole.MARKETING) {
      const deptName =
        departmentName ??
        (await this.prisma.department.findUnique({
          where: { id: departmentId },
          select: { name: true },
        }))?.name;
      if (deptName !== TaskDepartment.MARKETING) {
        throw new BadRequestException(
          "Marketing users can only be assigned to marketing department tasks",
        );
      }
    } else {
      throw new BadRequestException(
        "Task assignee must be an executable team member",
      );
    }

    return user;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const department = await this.prisma.department.findFirst({
      where: { name: dto.dept },
    });
    if (!department) {
      throw new BadRequestException(`Department ${dto.dept} not found`);
    }

    let assigneeInfo: { id: string; name: string } | null = null;

    if (dto.assignedTo) {
      assigneeInfo = await this.resolveAssignableUser(
        dto.assignedTo,
        department.id,
        dto.dept,
      );
    }

    const { dept, ...rest } = dto;
    const createdTask = await this.prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          ...rest,
          departmentId: department.id,
          dueDate: new Date(dto.dueDate),
          createdBy: userId,
          status: TaskStatus.TODO,
        },
      });

      await this.recalculateProjectProgress(dto.projectId, tx);

      return createdTask;
    });

  if (createdTask.assignedTo) {
      const departmentLabel = this.getDepartmentArabicLabel(department.name);

      this.notificationsService
        .createNotification({
          entityId: createdTask.id,
          entityType: "task",
          eventType: "TASK_ASSIGNED",
          userId: createdTask.assignedTo,
          title: "تم إسناد مهمة جديدة",
          body: departmentLabel
            ? `تم إسناد المهمة "${createdTask.title}" إليك في قسم ${departmentLabel}.`
            : `تم إسناد المهمة "${createdTask.title}" إليك.`,
          metadata: {
            taskId: createdTask.id,
            projectId: createdTask.projectId,
            assignedBy: userId,
            assigneeDepartment: department.name,
          },
        })
        .catch((err) =>
          this.logger.error(
            `Failed to create TASK_ASSIGNED notification for task=${createdTask.id} assignee=${createdTask.assignedTo}`,
            err,
          ),
        );
    }

    return createdTask;
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        assignee: true,
        creator: true,
        approver: true,
        department: { select: { id: true, name: true } },
        files: true,
        comments: {
          include: {
            user: true,
          },
        },
        statusHistory: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
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

    // Workflow enforcement
    if (
      toStatus === TaskStatus.IN_PROGRESS &&
      task.status !== TaskStatus.TODO &&
      task.status !== TaskStatus.REVISION
    ) {
      throw new BadRequestException("Task must be TODO or REVISION to start");
    }
    if (
      toStatus === TaskStatus.IN_REVIEW &&
      task.status !== TaskStatus.IN_PROGRESS
    ) {
      throw new BadRequestException("Task must be IN_PROGRESS to submit");
    }
    if (toStatus === TaskStatus.DONE && task.status !== TaskStatus.IN_REVIEW) {
      throw new BadRequestException("Task must be IN_REVIEW to approve");
    }
    if (
      toStatus === TaskStatus.REVISION &&
      task.status !== TaskStatus.IN_REVIEW
    ) {
      throw new BadRequestException(
        "Task must be IN_REVIEW to reject for revision",
      );
    }

    const updatedTask = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          status: toStatus,
          approvedBy: approvedBy || undefined,
          approvedAt: toStatus === TaskStatus.DONE ? new Date() : undefined,
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
          toStatus: toStatus,
          changedBy: userId,
        },
      });

      if (toStatus === TaskStatus.DONE) {
        const portalDepts = [TaskDepartment.DESIGN, TaskDepartment.CONTENT, TaskDepartment.MARKETING];
        const deptName = task.department?.name;
        if (deptName && portalDepts.includes(deptName as TaskDepartment)) {
          const existing = await tx.deliverable.findFirst({
            where: { taskId: id },
          });
          if (!existing) {
            await tx.deliverable.create({
              data: {
                projectId: task.projectId,
                taskId: id,
                title: task.title,
                description: task.description || undefined,
                filePath: "",
                isVisibleToClient: task.isVisibleToClient,
              },
            });
          }
        }
      }

      await this.recalculateProjectProgress(task.projectId, tx);

      return updated;
    });

    const isApproveOrReject =
      toStatus === TaskStatus.DONE || toStatus === TaskStatus.REVISION;
    const isSubmittedForReview = toStatus === TaskStatus.IN_REVIEW;

    const recipients = isApproveOrReject
      ? this.toUniqueUserIds(task.assignedTo)
      : isSubmittedForReview
        ? this.toUniqueUserIds(task.assignedTo, task.createdBy)
        : this.toUniqueUserIds(task.assignedTo);

    const statusNotificationByTarget: Record<
      TaskStatus,
      { eventType: string; title: string; body: string }
    > = {
      [TaskStatus.IN_PROGRESS]: {
        eventType: "TASK_STARTED",
        title: "بدأ تنفيذ المهمة",
        body: `بدأ الفريق تنفيذ المهمة "${task.title}".`,
      },
      [TaskStatus.IN_REVIEW]: {
        eventType: "TASK_SUBMITTED",
        title: "مهمة بانتظار المراجعة",
        body: `تم إرسال المهمة "${task.title}" للمراجعة.`,
      },
      [TaskStatus.DONE]: {
        eventType: "TASK_APPROVED",
        title: "تم اعتماد المهمة",
        body: `تم اعتماد المهمة "${task.title}".`,
      },
      [TaskStatus.REVISION]: {
        eventType: "TASK_REJECTED",
        title: "تم إرجاع المهمة للتعديل",
        body: `تم إرجاع المهمة "${task.title}" للتعديل.`,
      },
      [TaskStatus.TODO]: {
        eventType: "TASK_UPDATED",
        title: "تم تحديث المهمة",
        body: `تم تحديث المهمة "${task.title}".`,
      },
    };

    const notificationConfig = statusNotificationByTarget[toStatus];
    const notificationJobs: Array<Promise<any>> = recipients.map(
      (recipientId) =>
        this.notificationsService.createNotification({
          entityId: id,
          entityType: "task",
          eventType: notificationConfig.eventType,
          userId: recipientId,
          title: notificationConfig.title,
          body: notificationConfig.body,
          metadata: {
            taskId: task.id,
            projectId: task.projectId,
            changedBy: userId,
            status: toStatus,
          },
        }),
    );

    if (notificationJobs.length > 0) {
      Promise.allSettled(notificationJobs).catch((err) =>
        this.logger.error(`Failed to create some status-change notifications for task=${id}`, err),
      );
    }

    return updatedTask;
  }

  async assign(id: string, userId: string, dto: AssignTaskDto) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        projectId: true,
        departmentId: true,
        department: { select: { name: true } },
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!existingTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const assigneeInfo = await this.resolveAssignableUser(
      dto.userId,
      existingTask.departmentId,
      existingTask.department.name,
    );

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { assignedTo: dto.userId },
    });

    if (dto.userId !== existingTask.assignedTo) {
      const departmentLabel = this.getDepartmentArabicLabel(
        existingTask.department.name,
      );
      const recipients = this.toUniqueUserIds(
        dto.userId,
        existingTask.createdBy,
      );

      if (recipients.length > 0) {
        const notificationJobs = recipients.map((recipientId) =>
          this.notificationsService.createNotification({
            entityId: existingTask.id,
            entityType: "task",
            eventType: "TASK_ASSIGNED",
            userId: recipientId,
            title: "تم إسناد مهمة جديدة",
            body:
              recipientId === dto.userId
                ? departmentLabel
                  ? `تم إسناد المهمة "${existingTask.title}" إليك في قسم ${departmentLabel}.`
                  : `تم إسناد المهمة "${existingTask.title}" إليك.`
                : `تم إسناد المهمة "${existingTask.title}" إلى ${assigneeInfo.name}.`,
            metadata: {
              taskId: existingTask.id,
              projectId: existingTask.projectId,
              assignedBy: userId,
              assigneeDepartment: existingTask.department.name,
            },
          }),
        );

        Promise.allSettled(notificationJobs).catch((err) =>
          this.logger.error(
            `Failed to create some TASK_ASSIGNED notifications for task=${existingTask.id}`,
            err,
          ),
        );
      }
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

  async addFile(
    id: string,
    userId: string,
    file: Express.Multer.File,
    dto: UploadTaskFileDto,
  ) {
    if (!file) {
      throw new BadRequestException("Task file is required");
    }

    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const createdFile = await this.prisma.taskFile.create({
      data: {
        taskId: id,
        uploadedBy: userId,
        filePath: `/uploads/tasks/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        purpose: (dto.purpose ?? FilePurpose.REFERENCE) as FilePurpose,
      },
    });

    return this.mapTaskFile(createdFile);
  }

  async getFiles(id: string) {
    const files = await this.prisma.taskFile.findMany({
      where: { taskId: id },
      orderBy: { uploadedAt: "desc" },
    });

    return files.map((file) => this.mapTaskFile(file));
  }

  async downloadFile(
    taskId: string,
    fileId: string,
  ): Promise<{
    stream: ReadStream;
    fileName: string;
    mimeType: string;
  }> {
    const file = await this.prisma.taskFile.findFirst({
      where: { id: fileId, taskId },
      select: {
        filePath: true,
        fileName: true,
        fileType: true,
      },
    });

    if (!file) {
      throw new NotFoundException("Task file not found");
    }

    const normalizedPath = file.filePath.replace(/^\//, "");
    const absolutePath = join(process.cwd(), normalizedPath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException("Task file is missing on disk");
    }

    return {
      stream: createReadStream(absolutePath),
      fileName: file.fileName,
      mimeType: file.fileType,
    };
  }

  async addComment(id: string, userId: string, dto: CreateTaskCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true, assignedTo: true, createdBy: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId: id,
        userId,
        ...dto,
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
          title: "تعليق جديد على المهمة",
          body: `تمت إضافة تعليق جديد على المهمة "${task.title}".`,
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

  async findByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true } },
        files: true,
        comments: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findMine(
    userId: string,
    filters: {
      status?: string;
      priority?: string;
      dept?: string;
      dueBefore?: string;
      dueAfter?: string;
    },
  ) {
    const where: Record<string, unknown> = { assignedTo: userId };
    if (filters.status) where["status"] = filters.status;
    if (filters.priority) where["priority"] = filters.priority;
    if (filters.dept) where["departmentId"] = filters.dept;

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
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async myStats(userId: string) {
    const [grouped, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ["status"],
        where: { assignedTo: userId },
        _count: { status: true },
      }),
      this.prisma.task.count({
        where: {
          assignedTo: userId,
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
      where: { taskId },
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
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      const deletedTask = await tx.task.delete({ where: { id } });
      await this.recalculateProjectProgress(existingTask.projectId, tx);

      return deletedTask;
    });
  }

  async deleteFile(taskId: string, fileId: string) {
    return this.prisma.taskFile.delete({
      where: { id: fileId, taskId },
    });
  }

  async toggleArchive(taskId: string): Promise<{ message: string; archived: boolean }> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException("المهمة غير موجودة");
    }

    const isArchived = task.archivedAt !== null;
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { archivedAt: isArchived ? null : new Date() },
    });

    return {
      message: isArchived ? "تم إلغاء أرشفة المهمة" : "تم أرشفة المهمة",
      archived: !isArchived,
    };
  }
}
