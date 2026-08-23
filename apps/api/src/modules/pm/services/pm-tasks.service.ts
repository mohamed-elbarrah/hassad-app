import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { FilePurpose, Prisma } from "@prisma/client";
import { TaskDepartment, TaskPriority, TaskStatus } from "@hassad/shared";

import { StorageCategory } from "../../../common/storage/storage.constants";
import { StorageService } from "../../../common/storage/storage.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { TasksService } from "../../tasks/services/tasks.service";

@Injectable()
export class PmTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly storageService: StorageService,
  ) {}

  private async execute<T>(operation: () => Promise<T>, code: string) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) {
        const response = error.getResponse();
        if (
          typeof response === "object" &&
          response !== null &&
          "code" in response
        ) {
          throw error;
        }
        throw new HttpException({ code, details: {} }, error.getStatus());
      }
      throw new InternalServerErrorException({ code, details: {} });
    }
  }

  private async ownedTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { projectManagerId: userId } },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException({
        code: "TASK_NOT_FOUND",
        details: { taskId },
      });
    }

    return task;
  }

  async list(
    userId: string,
    filters: {
      search?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      projectId?: string;
      department?: TaskDepartment;
      dueBefore?: string;
      dueAfter?: string;
      overdue?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 100;
    const search = filters.search?.trim();
    const where: Prisma.TaskWhereInput = {
      project: { projectManagerId: userId },
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.department
        ? { department: { name: filters.department } }
        : {}),
      ...(filters.overdue
        ? { dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } }
        : filters.dueBefore || filters.dueAfter
          ? {
              dueDate: {
                ...(filters.dueBefore
                  ? { lte: new Date(filters.dueBefore) }
                  : {}),
                ...(filters.dueAfter
                  ? { gte: new Date(filters.dueAfter) }
                  : {}),
              },
            }
          : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { project: { name: { contains: search, mode: "insensitive" } } },
              {
                project: {
                  client: {
                    companyName: { contains: search, mode: "insensitive" },
                  },
                },
              },
              { assignee: { name: { contains: search, mode: "insensitive" } } },
              {
                department: { name: { contains: search, mode: "insensitive" } },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              clientId: true,
              status: true,
              client: { select: { companyName: true, businessType: true } },
            },
          },
          assignee: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          period: { select: { periodNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      __standardResponse: true as const,
      data: { items },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async stats(userId: string) {
    return this.tasksService.pmStats(userId);
  }

  async detail(userId: string, taskId: string) {
    await this.ownedTask(taskId, userId);
    return this.execute(
      () => this.tasksService.findOne(taskId),
      "TASK_NOT_FOUND",
    );
  }

  async changeStatus(userId: string, taskId: string, status: TaskStatus) {
    await this.ownedTask(taskId, userId);
    return this.execute(
      () => this.tasksService.changeStatus(taskId, userId, status),
      "TASK_STATUS_UPDATE_FAILED",
    );
  }

  async assign(userId: string, taskId: string, assigneeId: string) {
    await this.ownedTask(taskId, userId);
    return this.execute(
      () => this.tasksService.assign(taskId, userId, { userId: assigneeId }),
      "TASK_ASSIGNMENT_FAILED",
    );
  }

  async addComment(
    userId: string,
    taskId: string,
    content: string,
    isInternal = true,
  ) {
    await this.ownedTask(taskId, userId);
    return this.execute(
      () =>
        this.tasksService.addComment(taskId, userId, { content, isInternal }),
      "TASK_COMMENT_FAILED",
    );
  }

  async listComments(userId: string, taskId: string) {
    await this.ownedTask(taskId, userId);
    return {
      items: await this.execute(
        () => this.tasksService.getComments(taskId),
        "TASK_COMMENTS_LOAD_FAILED",
      ),
    };
  }

  async listFiles(userId: string, taskId: string) {
    await this.ownedTask(taskId, userId);
    return {
      items: await this.execute(
        () => this.tasksService.getFiles(taskId),
        "TASK_FILES_LOAD_FAILED",
      ),
    };
  }

  async downloadFile(userId: string, taskId: string, fileId: string) {
    await this.ownedTask(taskId, userId);
    return {
      url: await this.execute(
        () => this.tasksService.getDownloadUrl(taskId, fileId),
        "TASK_FILE_DOWNLOAD_FAILED",
      ),
    };
  }

  async deleteFile(userId: string, taskId: string, fileId: string) {
    await this.ownedTask(taskId, userId);
    return this.execute(
      () => this.tasksService.deleteFile(taskId, fileId),
      "TASK_FILE_DELETE_FAILED",
    );
  }

  async uploadFile(
    userId: string,
    taskId: string,
    file: Express.Multer.File,
    purpose?: FilePurpose,
  ) {
    await this.ownedTask(taskId, userId);
    if (!file) {
      throw new BadRequestException({
        code: "TASK_FILE_REQUIRED",
        details: { taskId },
      });
    }

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.TASK_FILE,
      entityId: taskId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    return this.execute(
      () =>
        this.tasksService.addFile(taskId, userId, {
          key: uploadResult.key,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          purpose: purpose ?? FilePurpose.REFERENCE,
        }),
      "TASK_FILE_UPLOAD_FAILED",
    );
  }
}
