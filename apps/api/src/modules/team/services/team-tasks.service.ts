import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { FilePurpose } from "@prisma/client";
import { TaskStatus } from "@hassad/shared";

import { Prisma } from "@prisma/client";
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

    if (!task) throw new NotFoundException({ code: "TEAM_TASK_NOT_FOUND", details: {} });
    return task;
  }

  private taskWhere(userId: string, query: TeamTasksQueryDto): Prisma.TaskWhereInput {
    const search = query.search?.trim();
    return {
      assignedTo: userId,
      archivedAt: null,
      status: query.status,
      priority: query.priority,
      department: query.department ? { name: query.department } : undefined,
      projectId: query.projectId,
      dueDate: query.dueBefore || query.dueAfter
        ? { lte: query.dueBefore ? new Date(query.dueBefore) : undefined, gte: query.dueAfter ? new Date(query.dueAfter) : undefined }
        : undefined,
      OR: search ? [
        { title: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { department: { name: { contains: search, mode: "insensitive" } } },
      ] : undefined,
    };
  }

  private taskInclude = {
    project: { select: { id: true, name: true } },
    assignee: { select: { id: true, name: true } },
    department: { select: { name: true } },
    period: { select: { id: true, periodNumber: true } },
  } satisfies Prisma.TaskInclude;

  async overview(userId: string, query: TeamTasksQueryDto) {
    const where = this.taskWhere(userId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const [tasks, total, grouped, overdue, dueToday] = await Promise.all([
      this.prisma.task.findMany({ where, include: this.taskInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.task.count({ where }),
      this.prisma.task.groupBy({ by: ["status"], where: this.taskWhere(userId, { ...query, status: undefined }), _count: { status: true } }),
      this.prisma.task.count({ where: { ...where, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } } }),
      this.prisma.task.count({ where: { ...where, dueDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(24, 0, 0, 0)) } } }),
    ]);
    const counts = Object.fromEntries(grouped.map((row) => [row.status, row._count.status]));
    const items = tasks.map((task) => this.mapCard(task));
    const kanban = Object.fromEntries(Object.values(TaskStatus).map((status) => [status, items.filter((item) => item.status === status)]));
    return {
      summary: { total, todo: counts[TaskStatus.TODO] ?? 0, inProgress: counts[TaskStatus.IN_PROGRESS] ?? 0, inReview: counts[TaskStatus.IN_REVIEW] ?? 0, revision: counts[TaskStatus.REVISION] ?? 0, done: counts[TaskStatus.DONE] ?? 0, overdue, dueToday },
      kanban, items, page, limit, totalPages: Math.ceil(total / limit),
    };
  }

  async list(userId: string, query: TeamTasksQueryDto) {
    const overview = await this.overview(userId, query);
    return { items: overview.items, page: overview.page, limit: overview.limit, total: overview.summary.total, totalPages: overview.totalPages };
  }

  async clientView(userId: string, clientId: string) {
    const access = await this.prisma.task.findFirst({ where: { ...this.ownedTaskWhere(userId), project: { clientId } }, select: { id: true } });
    if (!access) throw new NotFoundException({ code: "TEAM_CLIENT_NOT_FOUND", details: {} });
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
      throw new BadRequestException({ code: "TEAM_TASK_STATUS_FORBIDDEN", details: {} });
    }

    return this.tasksService.changeStatus(taskId, userId, status);
  }

  async addComment(userId: string, taskId: string, content: string) {
    await this.ownedTask(userId, taskId);
    return this.tasksService.addComment(taskId, userId, { content, isInternal: false });
  }

  async comments(userId: string, taskId: string, page = 1, limit = 25) {
    await this.ownedTask(userId, taskId);
    const where = { taskId, isInternal: false };
    const [items, total] = await Promise.all([
      this.prisma.taskComment.findMany({ where, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.taskComment.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async files(userId: string, taskId: string, page = 1, limit = 25) {
    await this.ownedTask(userId, taskId);
    const [files, total] = await Promise.all([
      this.prisma.taskFile.findMany({ where: { taskId }, orderBy: { uploadedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.taskFile.count({ where: { taskId } }),
    ]);
    const urls = await this.storageService.getMultiplePresignedUrls(files.map((file) => file.filePath));
    return {
      items: files.map((file) => ({
        id: file.id,
        taskId: file.taskId,
        uploadedBy: file.uploadedBy,
        fileName: file.fileName,
        filePath: file.filePath,
        fileSize: file.fileSize,
        mimeType: file.fileType,
        purpose: file.purpose,
        createdAt: file.uploadedAt,
        url: urls.get(file.filePath) ?? null,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async uploadFile(userId: string, taskId: string, file: Express.Multer.File, purpose?: FilePurpose) {
    await this.ownedTask(userId, taskId);
    if (!file) throw new BadRequestException({ code: "TEAM_TASK_FILE_REQUIRED", details: {} });

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
        ? { id: task.period.id, periodNumber: task.period.periodNumber }
        : null,
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
      isClientVisible: task.isVisibleToClient,
      isArchived: !!task.archivedAt,
    };
  }
}
