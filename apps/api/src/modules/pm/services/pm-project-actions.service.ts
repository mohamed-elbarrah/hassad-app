import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ContractType, FilePurpose, MeetingStatus, TaskDepartment, TaskPriority } from "@hassad/shared";

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

    if (!project) throw new NotFoundException("Project not found");
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
    if (!task) throw new NotFoundException("Task not found");
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
        if (!period) throw new NotFoundException("Period not found");
        periodId = period.id;
      } else {
        periodId = (await this.periodsService.getActivePeriod(projectId))?.id ?? (await this.prisma.projectPeriod.findFirst({ where: { projectId }, orderBy: { periodNumber: "asc" }, select: { id: true } }))?.id ?? null;
      }
      if (!periodId) throw new BadRequestException("Retainer projects require a period to schedule a meeting");
    }

    const meeting = await this.prisma.projectMeeting.create({
      data: {
        projectId,
        periodId,
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
        entityId: meeting.id,
        entityType: "project",
        eventType: "MEETING_SCHEDULED",
        userId: project.client.userId,
        title: "تم جدولة اجتماع جديد",
        body: dto.title,
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
    if (!existing) throw new NotFoundException("Meeting not found");

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
        title: "تحديث اجتماع",
        body: dto.title ?? updated.title,
      }).catch(() => undefined);
    }

    return updated;
  }

  async uploadFile(userId: string, projectId: string, dto: { periodId?: string }, file: Express.Multer.File) {
    const project = await this.ownedProject(projectId, userId);
    let periodId: string | null = null;

    if (dto.periodId) {
      const period = await this.prisma.projectPeriod.findFirst({
        where: { id: dto.periodId, projectId },
        select: { id: true },
      });
      if (!period) throw new NotFoundException("Period not found");
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
        entityId: created.id,
        entityType: "project",
        eventType: "PROJECT_FILE_UPLOADED",
        userId: project.client.userId,
        title: "تم رفع ملف جديد",
        body: file.originalname,
      }).catch(() => undefined);
    }

    return created;
  }

  async isRetainerProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { contract: { select: { type: true } }, periods: { select: { id: true } } },
    });
    return project?.contract?.type === ContractType.MONTHLY_RETAINER || (project?.periods?.length ?? 0) > 0;
  }
}
