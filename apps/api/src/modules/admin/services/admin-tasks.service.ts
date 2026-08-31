import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TaskStatus } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { AdminTasksQueryDto } from "../dto/admin-tasks.dto";
import { ProjectGroupChatService } from "../../chat/services/project-group-chat.service";

@Injectable()
export class AdminTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
    private readonly projectGroupChatService: ProjectGroupChatService,
  ) {}

  private buildWhere(query: AdminTasksQueryDto): Prisma.TaskWhereInput {
    const and: Prisma.TaskWhereInput[] = [];
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { project: { name: { contains: search, mode: "insensitive" } } },
          { assignee: { name: { contains: search, mode: "insensitive" } } },
          { department: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }
    if (query.assigneeId) and.push({ assignedTo: query.assigneeId });
    if (query.projectId) and.push({ projectId: query.projectId });
    if (query.department) and.push({ departmentId: query.department });
    if (query.status) and.push({ status: query.status });
    if (query.priority) and.push({ priority: query.priority });
    if (query.overdueOnly === true) {
      and.push({ dueDate: { lt: new Date() } });
      and.push({ status: { notIn: ["DONE", "REVISION"] } });
    }
    return and.length ? { AND: and } : {};
  }

  async findAll(query: AdminTasksQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              client: {
                select: {
                  companyName: true,
                },
              },
            },
          },
          assignee: { select: { id: true, name: true } },
          department: { select: { name: true } },
          period: {
            select: {
              periodNumber: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        projectName: t.project?.name ?? "—",
        projectStatus: t.project?.status ?? null,
        clientName: t.project?.client?.companyName ?? "—",
        assigneeId: t.assignedTo ?? null,
        assigneeName: t.assignee?.name ?? "—",
        department: t.department?.name ?? null,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        isVisibleToClient: t.isVisibleToClient,
        periodNumber: t.period?.periodNumber ?? null,
        isArchived: !!t.archivedAt,
        isOverdue: Boolean(
          t.dueDate &&
          t.dueDate < new Date() &&
          !["DONE", "REVISION"].includes(t.status),
        ),
        revisionCount: t.revisionCount,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Aggregate over the complete filtered result set, never just the current page. */
  async getStats(query: AdminTasksQueryDto) {
    const where = this.buildWhere(query);
    const [total, overdue, inProgress, inReview, done] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({
        where: {
          AND: [
            where,
            { dueDate: { lt: new Date() } },
            { status: { notIn: ["DONE", "REVISION"] } },
          ],
        },
      }),
      this.prisma.task.count({
        where: { AND: [where, { status: "IN_PROGRESS" }] },
      }),
      this.prisma.task.count({
        where: { AND: [where, { status: "IN_REVIEW" }] },
      }),
      this.prisma.task.count({ where: { AND: [where, { status: "DONE" }] } }),
    ]);
    return { total, overdue, inProgress, inReview, done };
  }

  async getActorCapabilities(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true,
            permissions: { select: { permission: { select: { name: true } } } },
          },
        },
        permissions: { select: { permission: { select: { name: true } } } },
      },
    });
    const names = new Set([
      ...(user?.role?.permissions.map((item) => item.permission.name) ?? []),
      ...(user?.permissions.map((item) => item.permission.name) ?? []),
    ]);
    return {
      canIntervene:
        user?.role?.name === "ADMIN" || names.has("admin.tasks.intervene"),
    };
  }

  private getValidTransitionTargets(status: TaskStatus): TaskStatus[] {
    switch (status) {
      case TaskStatus.TODO:
        return [TaskStatus.IN_PROGRESS];
      case TaskStatus.IN_PROGRESS:
        return [TaskStatus.IN_REVIEW];
      case TaskStatus.IN_REVIEW:
        return [TaskStatus.DONE, TaskStatus.REVISION];
      case TaskStatus.REVISION:
        return [TaskStatus.IN_PROGRESS];
      case TaskStatus.DONE:
      default:
        return [];
    }
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            client: {
              select: {
                id: true,
                companyName: true,
                status: true,
                totalPaid: true,
                activeProjects: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        department: { select: { name: true } },
        period: {
          select: {
            id: true,
            periodNumber: true,
          },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          include: {
            changer: {
              select: {
                name: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        files: {
          include: {
            uploader: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!task)
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });

    return {
      ...task,
      availableTransitionTargets: this.getValidTransitionTargets(
        task.status as TaskStatus,
      ),
      comments: task.comments.map((comment) => ({
        ...comment,
        userRole: comment.user?.role?.name ?? null,
      })),
      files: task.files.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        purpose: file.purpose,
        uploadedAt: file.uploadedAt,
        uploadedBy: file.uploadedBy,
        uploaderName: file.uploader?.name ?? null,
      })),
    };
  }

  async getDelayAlerts(query: {
    acknowledged?: boolean;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.TaskDelayAlertWhereInput = {};
    if (query.acknowledged !== undefined)
      where.isAcknowledged = query.acknowledged;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.taskDelayAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { triggeredAt: "desc" },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              project: { select: { name: true } },
              assignee: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.taskDelayAlert.count({ where }),
    ]);

    return {
      items: items.map((a) => ({
        id: a.id,
        taskId: a.taskId,
        taskTitle: a.task?.title ?? "—",
        projectName: a.task?.project?.name ?? "—",
        assigneeName: a.task?.assignee?.name ?? "—",
        alertLevel: a.alertLevel,
        isAcknowledged: a.isAcknowledged,
        triggeredAt: a.triggeredAt.toISOString(),
        acknowledgedAt: a.acknowledgedAt?.toISOString() ?? null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reassign(
    taskId: string,
    assigneeId: string,
    adminId: string,
    reason?: string,
  ) {
    const [task, user] = await Promise.all([
      this.prisma.task.findUnique({ where: { id: taskId } }),
      this.prisma.user.findUnique({ where: { id: assigneeId } }),
    ]);
    if (!task)
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });
    if (!user)
      throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

    const before = { assignedTo: task.assignedTo };
    const after = { assignedTo: assigneeId, reason };

    await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id: taskId },
        data: { assignedTo: assigneeId },
      }),
      this.prisma.taskStatusHistory.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus: task.status,
          changedBy: adminId,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.tasks.reassign",
          entity: "task",
          entityId: taskId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "task",
      targetId: taskId,
      actionType: "admin.tasks.reassign",
      reason,
      beforeState: before,
      afterState: after,
    });
    this.projectGroupChatService
      .syncParticipants(task.projectId)
      .catch(() => undefined);

    return { code: "TASK_REASSIGNED" };
  }

  async forceTransition(
    taskId: string,
    status: TaskStatus,
    reason: string,
    adminId: string,
  ) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task)
      throw new NotFoundException({ code: "TASK_NOT_FOUND", details: {} });

    const validTargets = this.getValidTransitionTargets(
      task.status as TaskStatus,
    );
    if (!validTargets.includes(status)) {
      throw new BadRequestException({
        code: "TASK_INVALID_TRANSITION",
        details: { fromStatus: task.status, toStatus: status },
      });
    }

    const before = { status: task.status };
    const after = { status, reason };

    await this.prisma.$transaction([
      this.prisma.task.update({ where: { id: taskId }, data: { status } }),
      this.prisma.taskStatusHistory.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus: status,
          changedBy: adminId,
        },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.tasks.force-transition",
          entity: "task",
          entityId: taskId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "task",
      targetId: taskId,
      actionType: "admin.tasks.force-transition",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { code: "TASK_STATUS_UPDATED" };
  }
}
