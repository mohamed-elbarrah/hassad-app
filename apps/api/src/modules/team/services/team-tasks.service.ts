import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { FilePurpose } from "@prisma/client";
import { TaskStatus } from "@hassad/shared";

import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { TasksService } from "../../tasks/services/tasks.service";
import { TeamTasksQueryDto } from "../dto/team-tasks.dto";
import { ClientProfileService } from "../../crm/services/client-profile.service";

@Injectable()
export class TeamTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly storageService: StorageService,
    private readonly clientProfileService: ClientProfileService,
  ) {}

  private async ownedTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, assignedTo: userId, archivedAt: null },
      select: { id: true },
    });

    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  async overview(userId: string, query: TeamTasksQueryDto) {
    const [tasks, stats] = await Promise.all([
      this.tasksService.findMine(userId, {
        status: query.status,
        priority: query.priority,
        deptName: query.department,
        projectId: query.projectId,
        dueBefore: query.dueBefore,
        dueAfter: query.dueAfter,
      }),
      this.tasksService.myStats(userId),
    ]);

    const search = query.search?.trim().toLowerCase();
    const filtered = tasks.filter((task: any) => {
      if (!search) return true;
      return [task.title, task.project?.name, task.department?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    const items = filtered.map((task: any) => this.mapCard(task));
    const kanban = Object.fromEntries(
      Object.values(TaskStatus).map((status) => [
        status,
        items.filter((item) => item.status === status),
      ]),
    );

    return {
      summary: {
        total: stats.total,
        todo: stats.todo,
        inProgress: stats.inProgress,
        inReview: stats.inReview,
        revision: items.filter((item) => item.status === TaskStatus.REVISION).length,
        done: stats.done,
        overdue: stats.overdue,
        dueToday: items.filter((item) => item.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
      },
      kanban,
      items,
    };
  }

  async list(userId: string, query: TeamTasksQueryDto) {
    const result = await this.overview(userId, query);
    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const start = (page - 1) * limit;
    const items = result.items.slice(start, start + limit);

    return {
      items,
      page,
      limit,
      total: result.items.length,
      totalPages: Math.ceil(result.items.length / limit),
    };
  }

  async clientView(userId: string, clientId: string) {
    const access = await this.prisma.task.findFirst({ where: { ...this.ownedTaskWhere(userId), project: { clientId } }, select: { id: true } });
    if (!access) throw new NotFoundException("Client not found");
    return this.clientProfileService.getTeamView(clientId);
  }

  private ownedTaskWhere(userId: string) { return { assignedTo: userId, archivedAt: null }; }

  async detail(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    const task = await this.tasksService.findOne(taskId);
    return {
      ...task,
      comments: task.comments.filter((comment: any) => !comment.isInternal),
    };
  }

  async changeStatus(userId: string, taskId: string, status: TaskStatus) {
    await this.ownedTask(userId, taskId);

    if (status === TaskStatus.DONE || status === TaskStatus.TODO) {
      throw new BadRequestException("Team users cannot make this status transition");
    }

    return this.tasksService.changeStatus(taskId, userId, status);
  }

  async addComment(userId: string, taskId: string, content: string) {
    await this.ownedTask(userId, taskId);
    return this.tasksService.addComment(taskId, userId, { content, isInternal: false });
  }

  async comments(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    const items = await this.tasksService.getComments(taskId);
    return { items: items.filter((item: any) => !item.isInternal) };
  }

  async files(userId: string, taskId: string) {
    await this.ownedTask(userId, taskId);
    return { items: await this.tasksService.getFiles(taskId) };
  }

  async uploadFile(userId: string, taskId: string, file: Express.Multer.File, purpose?: FilePurpose) {
    await this.ownedTask(userId, taskId);
    if (!file) throw new BadRequestException("Task file is required");

    const upload = await this.storageService.upload({
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
      key: upload.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      purpose: purpose ?? FilePurpose.REFERENCE,
    });
  }

  async downloadFile(userId: string, taskId: string, fileId: string) {
    await this.ownedTask(userId, taskId);
    return { url: await this.tasksService.getDownloadUrl(taskId, fileId) };
  }

  private mapCard(task: any) {
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      department: task.department?.name ?? null,
      dueDate: new Date(task.dueDate).toISOString(),
      isOverdue: new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE,
      revisionCount: task.revisionCount ?? 0,
      project: task.project ? { id: task.project.id, name: task.project.name } : null,
      period: task.period
        ? { id: task.period.id, label: `P${task.period.periodNumber}` }
        : null,
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
      isClientVisible: task.isVisibleToClient,
      isArchived: !!task.archivedAt,
    };
  }
}
