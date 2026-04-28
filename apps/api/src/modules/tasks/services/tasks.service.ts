import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto, CreateTaskFileDto, CreateTaskCommentDto } from '../dto/task.dto';
import { TaskStatus } from '@hassad/shared';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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

  async create(userId: string, dto: CreateTaskDto) {
    const department = await this.prisma.department.findFirst({ where: { name: dto.dept } });
    const { dept, ...rest } = dto;
    return this.prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          ...rest,
          departmentId: department?.id ?? undefined,
          dueDate: new Date(dto.dueDate),
          createdBy: userId,
          status: TaskStatus.TODO,
        },
      });

      await this.recalculateProjectProgress(dto.projectId, tx);

      return createdTask;
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
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

  private async updateStatus(id: string, userId: string, toStatus: TaskStatus, approvedBy?: string) {
    const task = await this.findOne(id);

    // Workflow enforcement
    if (toStatus === TaskStatus.IN_PROGRESS && task.status !== TaskStatus.TODO && task.status !== TaskStatus.REVISION) {
      throw new BadRequestException('Task must be TODO or REVISION to start');
    }
    if (toStatus === TaskStatus.IN_REVIEW && task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Task must be IN_PROGRESS to submit');
    }
    if (toStatus === TaskStatus.DONE && task.status !== TaskStatus.IN_REVIEW) {
      throw new BadRequestException('Task must be IN_REVIEW to approve');
    }
    if (toStatus === TaskStatus.REVISION && task.status !== TaskStatus.IN_REVIEW) {
      throw new BadRequestException('Task must be IN_REVIEW to reject for revision');
    }

    const updatedTask = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          status: toStatus,
          approvedBy: approvedBy || undefined,
          approvedAt: toStatus === TaskStatus.DONE ? new Date() : undefined,
          submittedAt: toStatus === TaskStatus.IN_REVIEW ? new Date() : undefined,
          startedAt: (toStatus === TaskStatus.IN_PROGRESS && !task.startedAt) ? new Date() : undefined,
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

      await this.recalculateProjectProgress(task.projectId, tx);

      return updated;
    });

    // Notify the assigned user on approval or rejection
    if (task.assignedTo && (toStatus === TaskStatus.DONE || toStatus === TaskStatus.REVISION)) {
      await this.notificationsService.createNotification({
        entityId: id,
        entityType: 'task',
        eventType: toStatus === TaskStatus.DONE ? 'TASK_APPROVED' : 'TASK_REJECTED',
        userId: task.assignedTo,
        title: toStatus === TaskStatus.DONE ? 'Task Approved' : 'Task Sent for Revision',
        body: toStatus === TaskStatus.DONE
          ? `Your task "${task.title}" has been approved`
          : `Your task "${task.title}" has been sent back for revision`,
      });
    }

    return updatedTask;
  }

  async assign(id: string, userId: string, dto: AssignTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: { assignedTo: dto.userId },
    });
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

  async addFile(id: string, userId: string, dto: CreateTaskFileDto) {
    return this.prisma.taskFile.create({
      data: {
        taskId: id,
        uploadedBy: userId,
        ...dto,
      },
    });
  }

  async getFiles(id: string) {
    return this.prisma.taskFile.findMany({
      where: { taskId: id },
    });
  }

  async addComment(id: string, userId: string, dto: CreateTaskCommentDto) {
    return this.prisma.taskComment.create({
      data: {
        taskId: id,
        userId,
        ...dto,
      },
    });
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMine(userId: string, filters: { status?: string; priority?: string; dept?: string; dueBefore?: string; dueAfter?: string }) {
    const where: Record<string, unknown> = { assignedTo: userId };
    if (filters.status) where['status'] = filters.status;
    if (filters.priority) where['priority'] = filters.priority;
    if (filters.dept) where['departmentId'] = filters.dept;

    if (filters.dueBefore || filters.dueAfter) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueBefore) dueDateFilter['lte'] = new Date(filters.dueBefore);
      if (filters.dueAfter) dueDateFilter['gte'] = new Date(filters.dueAfter);
      where['dueDate'] = dueDateFilter;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myStats(userId: string) {
    const [grouped, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
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
      blocked: counts['BLOCKED'] ?? 0,
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
      orderBy: { createdAt: 'asc' },
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

  async toggleArchive(_taskId: string): Promise<{ message: string }> {
    // Task model does not have an archivedAt field in the current schema.
    // This is a placeholder that returns a not-implemented response.
    return { message: 'Archive toggling is not supported in the current schema.' };
  }
}
