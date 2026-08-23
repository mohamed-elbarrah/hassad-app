import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ContractType, MeetingStatus, TaskDepartment, TaskPriority } from "@hassad/shared";

import { NotificationsService } from "../../notifications/services/notifications.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { StorageService } from "../../../common/storage/storage.service";
import { TasksService } from "../../tasks/services/tasks.service";
import { ProjectPeriodsService } from "../../projects/services/project-periods.service";

@Injectable()
export class PmProjectActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly periodsService: ProjectPeriodsService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async ownedProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, projectManagerId: userId, isArchived: false },
      select: {
        id: true,
        name: true,
        clientId: true,
        contractId: true,
        client: { select: { userId: true } },
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId },
      });
    }
    return project;
  }

  async listAssignableUsers(userId: string, projectId: string, params: { dept?: TaskDepartment; search?: string; limit?: number }) {
    await this.ownedProject(projectId, userId);
    return this.tasksService.searchAssignableUsers({
      dept: params.dept,
      search: params.search,
      limit: params.limit,
    });
  }

  async createTask(userId: string, projectId: string, dto: {
    dept: TaskDepartment;
    assignedTo?: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate: string;
    periodId?: string;
    isVisibleToClient?: boolean;
  }) {
    await this.ownedProject(projectId, userId);
    return this.tasksService.create(userId, {
      projectId,
      dept: dto.dept,
      assignedTo: dto.assignedTo,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate,
      periodId: dto.periodId,
      isVisibleToClient: dto.isVisibleToClient ?? false,
    });
  }

  async assignTask(userId: string, projectId: string, taskId: string, assigneeId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    });
    if (!task) {
      throw new NotFoundException({
        code: "TASK_NOT_FOUND",
        details: { taskId },
      });
    }
    await this.ownedProject(projectId, userId);
    return this.tasksService.assign(taskId, userId, { userId: assigneeId });
  }

  async createMeeting(userId: string, projectId: string, dto: {
    title: string;
    scheduledAt: string;
    durationMin?: number;
    location?: string;
    meetingLink?: string;
    periodId?: string;
  }) {
    const project = await this.ownedProject(projectId, userId);
    const isRetainer = await this.isRetainerProject(projectId);
    let periodId: string | null = null;

    if (isRetainer) {
      if (dto.periodId) {
        const period = await this.prisma.projectPeriod.findFirst({
          where: { id: dto.periodId, projectId },
          select: { id: true },
        });
        if (!period) {
          throw new NotFoundException({
            code: "PERIOD_NOT_FOUND",
            details: { periodId: dto.periodId },
          });
        }
        periodId = period.id;
      } else {
        periodId = (await this.periodsService.getActivePeriod(projectId))?.id ?? (await this.prisma.projectPeriod.findFirst({ where: { projectId }, orderBy: { periodNumber: "asc" }, select: { id: true } }))?.id ?? null;
      }
      if (!periodId) {
        throw new BadRequestException({
          code: "PERIOD_REQUIRED_FOR_RETAINER",
          details: { projectId },
        });
      }
    }

    const meeting = await this.prisma.projectMeeting.create({
      data: {
        projectId,
        periodId: periodId ?? undefined,
        title: dto.title,
        scheduledAt: new Date(dto.scheduledAt),
        durationMin: dto.durationMin ?? null,
        location: dto.location ?? null,
        meetingLink: dto.meetingLink ?? null,
        status: MeetingStatus.SCHEDULED,
        createdBy: userId,
      },
    });

    if (project.client?.userId) {
      this.notificationsService.createNotification({
        entityId: projectId,
        entityType: "project",
        eventType: "MEETING_SCHEDULED",
        userId: project.client.userId,
        metadata: { meetingId: meeting.id, meetingTitle: dto.title, projectId },
      }).catch(() => undefined);
    }

    return meeting;
  }

  async updateMeeting(userId: string, projectId: string, meetingId: string, dto: {
    title?: string;
    scheduledAt?: string;
    durationMin?: number;
    location?: string;
    meetingLink?: string;
    status?: MeetingStatus;
    notes?: string;
  }) {
    const project = await this.ownedProject(projectId, userId);
    const existing = await this.prisma.projectMeeting.findFirst({
      where: { id: meetingId, projectId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "MEETING_NOT_FOUND",
        details: { meetingId },
      });
    }

    const data: Prisma.ProjectMeetingUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.scheduledAt !== undefined) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMin !== undefined) data.durationMin = dto.durationMin;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.meetingLink !== undefined) data.meetingLink = dto.meetingLink;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.projectMeeting.update({
      where: { id: meetingId },
      data,
    });

    if (project.client?.userId) {
      this.notificationsService.createNotification({
        entityId: meetingId,
        entityType: "project",
        eventType: "MEETING_UPDATED",
        userId: project.client.userId,
        metadata: {
          meetingId,
          meetingTitle: dto.title ?? updated.title,
          projectId,
        },
      }).catch(() => undefined);
    }

    return updated;
  }

  async listFiles(userId: string, projectId: string) {
    await this.ownedProject(projectId, userId);

    const files = await this.prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
      include: {
        period: { select: { id: true, periodNumber: true } },
        uploader: { select: { id: true, name: true } },
      },
    });

    const urls = await this.storageService.getMultiplePresignedUrls(
      files.map((file) => file.filePath),
    );

    return {
      items: files.map((file) => ({
        id: file.id,
        projectId: file.projectId,
        periodId: file.periodId,
        periodLabel: file.period?.periodNumber ? `Period ${file.period.periodNumber}` : "Project",
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt.toISOString(),
        uploadedBy: file.uploader?.name ?? file.uploadedBy,
        url: urls.get(file.filePath) ?? null,
      })),
    };
  }

  async deleteFile(userId: string, projectId: string, fileId: string) {
    await this.ownedProject(projectId, userId);
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, projectId },
      select: { filePath: true },
    });
    if (!file) {
      throw new NotFoundException({
        code: "FILE_NOT_FOUND",
        details: { fileId },
      });
    }
    await this.storageService.deleteByKey(file.filePath);
    await this.prisma.projectFile.delete({ where: { id: fileId } });
    return { code: "PROJECT_FILE_DELETED" };
  }

  async getFileDownloadUrl(userId: string, projectId: string, fileId: string) {
    await this.ownedProject(projectId, userId);
    const file = await this.prisma.projectFile.findFirst({
      where: { id: fileId, projectId },
      select: { filePath: true },
    });

    if (!file) {
      throw new NotFoundException({
        code: "FILE_NOT_FOUND",
        details: { fileId },
      });
    }
    return { url: await this.storageService.getPresignedUrl(file.filePath) };
  }

  async uploadFile(userId: string, projectId: string, dto: { periodId?: string }, file: Express.Multer.File) {
    const project = await this.ownedProject(projectId, userId);
    let periodId: string | null = null;

    if (dto.periodId) {
      const period = await this.prisma.projectPeriod.findFirst({
        where: { id: dto.periodId, projectId },
        select: { id: true },
      });
      if (!period) {
        throw new NotFoundException({
          code: "PERIOD_NOT_FOUND",
          details: { periodId: dto.periodId },
        });
      }
      periodId = period.id;
    }

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.PROJECT_FILE,
      entityId: projectId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    const created = await this.prisma.projectFile.create({
      data: {
        projectId,
        periodId,
        uploadedBy: userId,
        fileName: file.originalname,
        filePath: uploadResult.key,
        fileType: file.mimetype,
        fileSize: file.size,
      },
    });

    if (project.client?.userId) {
      this.notificationsService.createNotification({
        entityId: projectId,
        entityType: "project",
        eventType: "PROJECT_FILE_UPLOADED",
        userId: project.client.userId,
        metadata: { projectId, fileId: created.id, fileName: file.originalname },
      }).catch(() => undefined);
    }

    return {
      id: created.id,
      projectId: created.projectId,
      periodId: created.periodId,
      fileName: created.fileName,
      fileType: created.fileType,
      fileSize: created.fileSize,
      uploadedAt: created.uploadedAt.toISOString(),
      uploadedBy: userId,
      url: await this.storageService.getPresignedUrl(created.filePath),
    };
  }

  async isRetainerProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { contract: { select: { type: true } }, periods: { select: { id: true } } },
    });
    return project?.contract?.type === ContractType.MONTHLY_RETAINER || (project?.periods?.length ?? 0) > 0;
  }
}
