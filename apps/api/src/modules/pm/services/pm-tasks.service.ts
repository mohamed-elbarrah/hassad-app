import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { FilePurpose } from "@prisma/client";
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

  private async ownedTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { projectManagerId: userId } },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
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
      limit?: number;
    },
  ) {
    const tasks = await this.tasksService.findPmTasks(userId, {
      status: filters.status,
      priority: filters.priority,
      projectId: filters.projectId,
      deptName: filters.department,
      dueBefore: filters.dueBefore,
      dueAfter: filters.dueAfter,
    });

    const query = (filters.search ?? "").trim().toLowerCase();
    const items = tasks
      .filter((task: any) => {
        if (!query) return true;
        return [
          task.title,
          task.project?.name,
          task.project?.client?.companyName,
          task.assignee?.name,
          task.department?.name,
          task.period?.periodNumber ? `P${task.period.periodNumber}` : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .slice(0, filters.limit ?? 100)
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        projectId: task.projectId,
        projectName: task.project?.name ?? "Unknown project",
        clientName: task.project?.client?.companyName ?? "Unknown client",
        projectStatus: task.project?.status ?? null,
        department: task.department?.name ?? TaskDepartment.DESIGN,
        assigneeName: task.assignee?.name ?? null,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        periodLabel: task.period?.periodNumber ? `P${task.period.periodNumber}` : "No period",
        isClientVisible: !!task.isVisibleToClient,
        revisionCount: task.revisionCount ?? 0,
        periodNumber: task.period?.periodNumber ?? null,
      }));

    return { items };
  }

  async detail(userId: string, taskId: string) {
    await this.ownedTask(taskId, userId);
    return this.tasksService.findOne(taskId);
  }

  async changeStatus(userId: string, taskId: string, status: TaskStatus) {
    await this.ownedTask(taskId, userId);
    return this.tasksService.changeStatus(taskId, userId, status);
  }

  async assign(userId: string, taskId: string, assigneeId: string) {
    await this.ownedTask(taskId, userId);
    return this.tasksService.assign(taskId, userId, { userId: assigneeId });
  }

  async addComment(userId: string, taskId: string, content: string, isInternal = true) {
    await this.ownedTask(taskId, userId);
    return this.tasksService.addComment(taskId, userId, { content, isInternal });
  }

  async listComments(userId: string, taskId: string) {
    await this.ownedTask(taskId, userId);
    return { items: await this.tasksService.getComments(taskId) };
  }

  async listFiles(userId: string, taskId: string) {
    await this.ownedTask(taskId, userId);
    return { items: await this.tasksService.getFiles(taskId) };
  }

  async downloadFile(userId: string, taskId: string, fileId: string) {
    await this.ownedTask(taskId, userId);
    return { url: await this.tasksService.getDownloadUrl(taskId, fileId) };
  }

  async uploadFile(userId: string, taskId: string, file: Express.Multer.File, purpose?: FilePurpose) {
    await this.ownedTask(taskId, userId);
    if (!file) throw new BadRequestException("Task file is required");

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

    return this.tasksService.addFile(taskId, userId, {
      key: uploadResult.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      purpose: purpose ?? FilePurpose.REFERENCE,
    });
  }
}
