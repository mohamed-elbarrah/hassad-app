import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto, CreateTaskFileDto, CreateTaskCommentDto } from '../dto/task.dto';
import { TaskStatus } from '@hassad/shared';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        ...dto,
        dueDate: new Date(dto.dueDate),
        createdBy: userId,
        status: TaskStatus.TODO,
      },
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
    if (toStatus === TaskStatus.IN_PROGRESS && task.status !== TaskStatus.TODO) {
      throw new BadRequestException('Task must be TODO to start');
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

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
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

      // TODO: Emit notification

      return updatedTask;
    });
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
}
