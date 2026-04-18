import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  UserRole,
  TaskPriority,
  TaskStatus,
  TaskDepartment,
  TASK_STATUS_TRANSITIONS,
} from "@hassad/shared";
import { MyTasksFiltersDto } from "./dto/my-tasks-filters.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── findAllByProject ────────────────────────────────────────────────────────

  async findAllByProject(projectId: string, user: JwtPayload) {
    // Verify the project exists and the caller has access to it
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, managerId: true },
    });

    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (user.role === UserRole.PM && project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return this.prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dept: true,
        dueDate: true,
        description: true,
        assignedTo: true,
        assignee: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // ─── findOne ────────────────────────────────────────────────────────────────

  async findOne(id: string, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, managerId: true } },
      },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);

    // PM can only view tasks in their own projects
    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    // EMPLOYEE can only view tasks assigned to them
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    return task;
  }

  // ─── create ─────────────────────────────────────────────────────────────────

  async create(projectId: string, dto: CreateTaskDto, user: JwtPayload) {
    // Verify project exists and caller has access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, managerId: true },
    });

    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (user.role === UserRole.PM && project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this project");
    }

    // Validate assignee: must be EMPLOYEE and department must match
    const assignee = await this.prisma.user.findUnique({
      where: { id: dto.assignedTo },
      select: { id: true, role: true, department: true, isActive: true },
    });

    if (!assignee || !assignee.isActive) {
      throw new NotFoundException(
        `User ${dto.assignedTo} not found or inactive`,
      );
    }

    if (assignee.role !== UserRole.EMPLOYEE) {
      throw new BadRequestException("Tasks can only be assigned to employees");
    }

    if (assignee.department !== dto.dept) {
      throw new BadRequestException(
        `User department (${assignee.department}) does not match task department (${dto.dept})`,
      );
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        projectId,
        assignedTo: dto.assignedTo,
        dept: dto.dept,
        priority: dto.priority ?? TaskPriority.NORMAL,
        dueDate: new Date(dto.dueDate),
        description: dto.description ?? null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });
  }

  // ─── update ─────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateTaskDto, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { managerId: true } } },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);

    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    // If reassigning, validate new assignee
    if (dto.assignedTo !== undefined) {
      const newAssignee = await this.prisma.user.findUnique({
        where: { id: dto.assignedTo },
        select: { id: true, role: true, department: true, isActive: true },
      });

      if (!newAssignee || !newAssignee.isActive) {
        throw new NotFoundException(
          `User ${dto.assignedTo} not found or inactive`,
        );
      }

      if (newAssignee.role !== UserRole.EMPLOYEE) {
        throw new BadRequestException(
          "Tasks can only be assigned to employees",
        );
      }

      // Use new dept if provided, otherwise use existing task dept
      const effectiveDept = dto.dept ?? task.dept;
      if (newAssignee.department !== effectiveDept) {
        throw new BadRequestException(
          `User department (${newAssignee.department}) does not match task department (${effectiveDept})`,
        );
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
        ...(dto.dept !== undefined && { dept: dto.dept }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // ─── updateStatus ────────────────────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateTaskStatusDto, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { managerId: true } } },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);

    // PM can update status of tasks in their own projects
    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    // EMPLOYEE can only update status of tasks assigned to them
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException(
        "You can only update status of your own tasks",
      );
    }

    // ADMIN bypasses transition rules
    if (user.role !== UserRole.ADMIN) {
      const allowed =
        TASK_STATUS_TRANSITIONS[task.status]?.[
          user.role as UserRole.PM | UserRole.EMPLOYEE
        ] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition task from ${task.status} to ${dto.status} as ${user.role}`,
        );
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ─── remove ─────────────────────────────────────────────────────────────────

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);

    await this.prisma.task.delete({ where: { id } });
  }

  // ─── getMyTasks ──────────────────────────────────────────────────────────────

  async getMyTasks(user: JwtPayload, filters: MyTasksFiltersDto) {
    const where: Prisma.TaskWhereInput = {};

    if (user.role === UserRole.EMPLOYEE) {
      where.assignedTo = user.id;
    } else if (user.role === UserRole.PM) {
      where.OR = [{ assignedTo: user.id }, { project: { managerId: user.id } }];
    }

    if (filters.archived === true) {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.dept) where.dept = filters.dept;
    if (filters.dueBefore || filters.dueAfter) {
      where.dueDate = {};
      if (filters.dueBefore)
        (where.dueDate as Prisma.DateTimeFilter).lte = new Date(
          filters.dueBefore,
        );
      if (filters.dueAfter)
        (where.dueDate as Prisma.DateTimeFilter).gte = new Date(
          filters.dueAfter,
        );
    }

    return this.prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dept: true,
        dueDate: true,
        archivedAt: true,
        description: true,
        assignedTo: true,
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { dueDate: "asc" },
    });
  }

  // ─── getMyTaskStats ──────────────────────────────────────────────────────────

  async getMyTaskStats(user: JwtPayload) {
    const baseWhere: Prisma.TaskWhereInput = { archivedAt: null };

    if (user.role === UserRole.EMPLOYEE) {
      baseWhere.assignedTo = user.id;
    } else if (user.role === UserRole.PM) {
      baseWhere.OR = [
        { assignedTo: user.id },
        { project: { managerId: user.id } },
      ];
    }

    const [counts, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { status: true },
      }),
      this.prisma.task.count({
        where: {
          ...baseWhere,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
    ]);

    const stats = {
      total: 0,
      todo: 0,
      inProgress: 0,
      inReview: 0,
      blocked: 0,
      done: 0,
      overdue,
    };

    for (const c of counts) {
      const count = c._count.status;
      stats.total += count;
      if (c.status === TaskStatus.TODO) stats.todo = count;
      else if (c.status === TaskStatus.IN_PROGRESS) stats.inProgress = count;
      else if (c.status === TaskStatus.IN_REVIEW) stats.inReview = count;
      else if (c.status === TaskStatus.BLOCKED) stats.blocked = count;
      else if (c.status === TaskStatus.DONE) stats.done = count;
    }

    return stats;
  }

  // ─── toggleArchive ───────────────────────────────────────────────────────────

  async toggleArchive(id: string, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { project: { select: { managerId: true } } },
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);

    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }

    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException("You can only archive your own tasks");
    }

    return this.prisma.task.update({
      where: { id },
      data: { archivedAt: task.archivedAt ? null : new Date() },
      select: { id: true, archivedAt: true },
    });
  }

  // ─── uploadFile ──────────────────────────────────────────────────────────────

  async uploadFile(
    taskId: string,
    user: JwtPayload,
    file: Express.Multer.File,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { managerId: true } } },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException(
        "You can only upload files to your own tasks",
      );
    }

    return this.prisma.taskFile.create({
      data: {
        taskId,
        uploadedById: user.id,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
      },
    });
  }

  // ─── getTaskFiles ────────────────────────────────────────────────────────────

  async getTaskFiles(taskId: string, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { managerId: true } } },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException("You can only view files of your own tasks");
    }

    return this.prisma.taskFile.findMany({
      where: { taskId },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ─── deleteFile ──────────────────────────────────────────────────────────────

  async deleteFile(taskId: string, fileId: string, user: JwtPayload) {
    const file = await this.prisma.taskFile.findUnique({
      where: { id: fileId },
      include: {
        task: { include: { project: { select: { managerId: true } } } },
      },
    });
    if (!file || file.taskId !== taskId) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (user.role === UserRole.PM && file.task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }
    if (user.role === UserRole.EMPLOYEE && file.task.assignedTo !== user.id) {
      throw new ForbiddenException(
        "You can only delete files from your own tasks",
      );
    }

    const fsPromises = await import("fs/promises");
    try {
      await fsPromises.unlink(file.filePath);
    } catch {
      // File may already be missing from disk — proceed with DB deletion
    }

    await this.prisma.taskFile.delete({ where: { id: fileId } });
  }

  // ─── downloadFile ────────────────────────────────────────────────────────────

  async downloadFile(taskId: string, fileId: string, user: JwtPayload) {
    const file = await this.prisma.taskFile.findUnique({
      where: { id: fileId },
      include: {
        task: { include: { project: { select: { managerId: true } } } },
      },
    });
    if (!file || file.taskId !== taskId) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (user.role === UserRole.PM && file.task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }
    if (user.role === UserRole.EMPLOYEE && file.task.assignedTo !== user.id) {
      throw new ForbiddenException(
        "You can only download files from your own tasks",
      );
    }

    return {
      filePath: file.filePath,
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }

  // ─── addComment ──────────────────────────────────────────────────────────────

  async addComment(taskId: string, user: JwtPayload, dto: CreateCommentDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { managerId: true } } },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException("You can only comment on your own tasks");
    }

    return this.prisma.taskComment.create({
      data: {
        taskId,
        userId: user.id,
        content: dto.content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  // ─── getComments ─────────────────────────────────────────────────────────────

  async getComments(taskId: string, user: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { managerId: true } } },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    if (user.role === UserRole.PM && task.project.managerId !== user.id) {
      throw new ForbiddenException("You do not have access to this task");
    }
    if (user.role === UserRole.EMPLOYEE && task.assignedTo !== user.id) {
      throw new ForbiddenException(
        "You can only view comments on your own tasks",
      );
    }

    return this.prisma.taskComment.findMany({
      where: { taskId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
