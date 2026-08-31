import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ClientKind } from "@hassad/shared";
import { AdminActionLogService } from "./admin-action-log.service";
import { ProjectGroupChatService } from "../../chat/services/project-group-chat.service";
import { ProjectStatus, TaskStatus, TaskPriority } from "@hassad/shared";

@Injectable()
export class AdminProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actionLog: AdminActionLogService,
    private readonly projectGroupChatService: ProjectGroupChatService,
  ) {}

  async getActorCapabilities(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true, permissions: { select: { permission: { select: { name: true } } } } } },
        permissions: { select: { permission: { select: { name: true } } } },
      },
    });
    const permissions = new Set([
      ...(user?.role?.permissions.map(({ permission }) => permission.name) ?? []),
      ...(user?.permissions.map(({ permission }) => permission.name) ?? []),
    ]);
    return { canIntervene: user?.role?.name === "ADMIN" || permissions.has("admin.projects.intervene") };
  }

  async findAll(query: {
    search?: string; pmId?: string; clientId?: string; status?: string;
    priority?: string; overdueOnly?: boolean; page?: number; limit?: number;
  }) {
    const where: any = {}; // Prisma relation filters are scoped to this service query.
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        {
          client: {
            companyName: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          manager: {
            name: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }
    if (query.pmId) where.projectManagerId = query.pmId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.overdueOnly === true) {
      where.tasks = {
        some: {
          dueDate: { lt: new Date() },
          status: { notIn: ["DONE", "REVISION"] },
        },
      };
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          manager: { select: { id: true, name: true } },
          tasks: {
            where: {
              dueDate: { lt: new Date() },
              status: { notIn: ["DONE", "REVISION"] },
            },
            select: { id: true },
          },
          contract: { select: { totalValue: true } },
          invoiceItems: { select: { total: true } },
          periods: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map((p: any) => {
        const now = new Date();
        const isBehindSchedule =
          p.endDate &&
          p.endDate < now &&
          p.status !== "COMPLETED" &&
          p.status !== "CANCELLED";
        const completedPeriods =
          p.periods?.filter((per: any) => per.status === "COMPLETED").length ??
          0;
        const totalPeriods = p.periods?.length ?? 0;
        const totalInvoiced =
          p.invoiceItems?.reduce(
            (sum: number, item: any) => sum + Number(item.total ?? 0),
            0,
          ) ?? 0;
        const remainingValue = Number(p.contract?.totalValue ?? 0) - totalInvoiced;

        return {
          id: p.id,
          name: p.name,
          clientName: p.client?.companyName ?? "—",
          pmId: p.manager?.id ?? null,
          pmName: p.manager?.name ?? "—",
          status: p.status,
          completionPercentage: p.completionPercentage,
          overdueTasksCount: p.tasks?.length ?? 0,
          priority: p.priority,
          totalValue: Number(p.contract?.totalValue ?? 0),
          startDate: p.startDate?.toISOString() ?? null,
          endDate: p.endDate?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          isBehindSchedule,
          completedPeriods,
          totalPeriods,
          remainingValue,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        manager: { select: { id: true, name: true, email: true } },
        contract: { select: { totalValue: true, monthlyValue: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: true,
            revisionCount: true,
            isVisibleToClient: true,
            archivedAt: true,
            period: {
              select: {
                id: true,
                periodNumber: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        files: {
          select: {
            id: true,
            fileName: true,
            uploadedBy: true,
            uploadedAt: true,
            uploader: {
              select: {
                name: true,
              },
            },
          },
        },
        meetings: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            notes: true,
            createdBy: true,
            creator: {
              select: {
                name: true,
              },
            },
            periodId: true,
          },
        },
        periods: {
          select: {
            id: true,
            periodNumber: true,
            startDate: true,
            endDate: true,
            status: true,
            completionPercentage: true,
            summary: true,
          },
        },
        invoiceItems: {
          include: {
            invoice: {
              include: {
                payments: true,
              },
            },
          },
        },
        disputeTickets: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            category: true,
            status: true,
            priority: true,
            openedAt: true,
            deadlineAt: true,
          },
        },
      },
    });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

    const invoices = new Map<string, any>();
    const payments: any[] = [];
    for (const item of project.invoiceItems ?? []) {
      if (item.invoice && !invoices.has(item.invoice.id)) {
        invoices.set(item.invoice.id, item.invoice);
      }
    }
    for (const inv of invoices.values()) {
      if (inv.payments) {
        for (const p of inv.payments) {
          payments.push(p);
        }
      }
    }

    const history = await this.prisma.ledger.findMany({
      where: { entity: "project", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true } } },
    });

    const { invoiceItems, ...rest } = project;
    return {
      ...rest,
      // Prisma Decimal values must be converted before the response reaches JSON.
      contract: project.contract
        ? {
            ...project.contract,
            totalValue: Number(project.contract.totalValue),
            monthlyValue: Number(project.contract.monthlyValue),
          }
        : null,
      totalValue: Number(project.contract?.totalValue ?? 0),
      monthlyValue: Number(project.contract?.monthlyValue ?? 0),
      invoices: Array.from(invoices.values()).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: Number(inv.amount),
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
        paymentMethod: inv.paymentMethod,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMethod: p.method,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
      disputeTickets: project.disputeTickets ?? [],
      history: history.map((h) => ({
        id: h.id,
        action: h.action,
        userId: h.userId,
        userName: h.user?.name ?? "—",
        before: h.before,
        after: h.after,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async getPeriods(projectId: string) {
    await this.assertProject(projectId);
    const periods = await this.prisma.projectPeriod.findMany({
      where: { projectId },
      orderBy: { periodNumber: "asc" },
      select: {
        id: true, periodNumber: true, startDate: true, endDate: true,
        status: true, completionPercentage: true,
        invoice: { select: { id: true, invoiceNumber: true, status: true, amount: true } },
        _count: { select: { tasks: true, deliverables: true, meetings: true } },
      },
    });
    return periods.map((period) => ({
      ...period,
      invoice: period.invoice
        ? { ...period.invoice, amount: Number(period.invoice.amount) }
        : null,
    }));
  }

  async getTeam(projectId: string) {
    await this.assertProject(projectId);
    return this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { joinedAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    });
  }

  async getDeliverables(
    projectId: string,
    query: { status?: string; page?: number; limit?: number },
  ) {
    await this.assertProject(projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: any = { projectId };
    if (query.status) where.status = query.status;
    const [items, total] = await Promise.all([
      this.prisma.deliverable.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          task: { select: { id: true, title: true } },
          period: { select: { id: true, periodNumber: true } },
        },
      }),
      this.prisma.deliverable.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTasks(
    projectId: string,
    query: { status?: string; priority?: string; page?: number; limit?: number },
  ) {
    await this.assertProject(projectId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: any = { projectId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: true,
          assignee: { select: { name: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);
    return {
      items: items.map((task) => ({
        ...task,
        dueDate: task.dueDate?.toISOString() ?? null,
        assigneeName: task.assignee?.name ?? "—",
        isOverdue: !!task.dueDate && task.dueDate < new Date() && task.status !== "DONE",
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTimeline(projectId: string) {
    await this.assertProject(projectId);
    return this.prisma.ledger.findMany({
      where: { entity: "project", entityId: projectId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, action: true, createdAt: true, user: { select: { id: true, name: true } } },
    });
  }

  private async assertProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });
  }

  async reassignPm(
    projectId: string,
    pmUserId: string,
    adminId: string,
    reason?: string,
  ) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.user.findFirst({
        where: { id: pmUserId, isActive: true, role: { name: "PM" } },
      }),
    ]);
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });
    if (!user) throw new NotFoundException({ code: "PROJECT_MANAGER_NOT_ELIGIBLE", details: {} });

    const before = { projectManagerId: project.projectManagerId };
    const after = { projectManagerId: pmUserId, reason };

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { projectManagerId: pmUserId },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.projects.reassign-pm",
          entity: "project",
          entityId: projectId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "project",
      targetId: projectId,
      actionType: "admin.projects.reassign-pm",
      reason,
      beforeState: before,
      afterState: after,
    });
    this.projectGroupChatService
      .syncParticipants(projectId)
      .catch(() => undefined);

    return { code: "PROJECT_ACTION_COMPLETED" };
  }

  async archive(projectId: string, adminId: string, reason?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

    const before = { isArchived: project.isArchived };
    const after = { isArchived: true, archivedAt: new Date(), reason };

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { isArchived: true, archivedAt: new Date() },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.projects.archive",
          entity: "project",
          entityId: projectId,
          userId: adminId,
          before,
          after,
        },
      }),
    ]);

    await this.actionLog.record({
      actorId: adminId,
      targetType: "project",
      targetId: projectId,
      actionType: "admin.projects.archive",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { code: "PROJECT_ACTION_COMPLETED" };
  }

  async forceStatus(
    projectId: string,
    status: ProjectStatus,
    reason: string,
    adminId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

    const before = { status: project.status };
    const after = { status, reason };

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { status },
      });
      if (
        status === ProjectStatus.ACTIVE ||
        status === ProjectStatus.COMPLETED
      ) {
        await tx.client.update({
          where: { id: project.clientId },
          data: { kind: ClientKind.CLIENT },
        });
      }
      await tx.ledger.create({
        data: {
          action: "admin.projects.force-status",
          entity: "project",
          entityId: projectId,
          userId: adminId,
          before,
          after,
        },
      });
    });

    await this.actionLog.record({
      actorId: adminId,
      targetType: "project",
      targetId: projectId,
      actionType: "admin.projects.force-status",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { code: "PROJECT_ACTION_COMPLETED" };
  }

  async unarchive(projectId: string, adminId: string, reason?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });
    if (!project.isArchived)
      throw new BadRequestException({ code: "PROJECT_NOT_ARCHIVED", details: {} });

    const before = {
      isArchived: project.isArchived,
      archivedAt: project.archivedAt,
    };
    const after = { isArchived: false, archivedAt: null, reason };

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { isArchived: false, archivedAt: null },
      });
      if (
        project.status === ProjectStatus.ACTIVE ||
        project.status === ProjectStatus.COMPLETED
      ) {
        await tx.client.update({
          where: { id: project.clientId },
          data: { kind: ClientKind.CLIENT },
        });
      }
      await tx.ledger.create({
        data: {
          action: "admin.projects.unarchive",
          entity: "project",
          entityId: projectId,
          userId: adminId,
          before,
          after,
        },
      });
    });

    await this.actionLog.record({
      actorId: adminId,
      targetType: "project",
      targetId: projectId,
      actionType: "admin.projects.unarchive",
      reason,
      beforeState: before,
      afterState: after,
    });

    return { code: "PROJECT_ACTION_COMPLETED" };
  }

  async create(
    data: {
      name: string;
      clientId: string;
      projectManagerId?: string;
      status?: string;
      startDate: string;
      endDate: string;
      description?: string;
      priority?: string;
    },
    adminId: string,
  ) {
    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: data.name,
          clientId: data.clientId,
          projectManagerId: data.projectManagerId,
          status: (data.status as ProjectStatus) ?? ProjectStatus.PLANNING,
          priority: (data.priority as TaskPriority) ?? TaskPriority.NORMAL,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          description: data.description,
        },
      });

      if (
        created.status === ProjectStatus.ACTIVE ||
        created.status === ProjectStatus.COMPLETED
      ) {
        await tx.client.update({
          where: { id: created.clientId },
          data: { kind: ClientKind.CLIENT },
        });
      }

      await tx.ledger.create({
        data: {
          action: "admin.projects.create",
          entity: "project",
          entityId: created.id,
          userId: adminId,
          after: { name: data.name, clientId: data.clientId },
        },
      });

      return created;
    });

    await this.actionLog.record({
      actorId: adminId,
      targetType: "project",
      targetId: project.id,
      actionType: "admin.projects.create",
      afterState: { name: data.name, clientId: data.clientId },
    });
    this.projectGroupChatService
      .ensure(project.id)
      .catch(() => undefined);

    return project;
  }

  async addMember(
    projectId: string,
    userId: string,
    role: string,
    adminId: string,
    reason?: string,
  ) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", details: {} });

    const member = await this.prisma.$transaction(async (tx) => {
      const created = await tx.projectMember.create({
        data: { projectId, userId, role: role as any },
      });

      await tx.ledger.create({
        data: {
          action: "admin.projects.add-member",
          entity: "project",
          entityId: projectId,
          userId: adminId,
          after: { userId, role, name: user.name },
        },
      });

      return created;
    });

    await this.actionLog.record({
      actorId: adminId,
      targetType: "project",
      targetId: projectId,
      actionType: "admin.projects.add-member",
      reason,
      afterState: { userId, role, name: user.name },
    });
    this.projectGroupChatService
      .syncParticipants(projectId)
      .catch(() => undefined);

    return member;
  }

  async addTask(
    projectId: string,
    data: {
      title: string;
      assigneeId?: string;
      priority?: string;
      dueDate?: string;
      status?: string;
    },
    adminId?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException({ code: "PROJECT_NOT_FOUND", details: {} });

    let defaultDept = await this.prisma.department.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!defaultDept) {
      defaultDept = await this.prisma.department.create({
        data: { name: "General" },
      });
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          projectId,
          title: data.title,
          assignedTo: data.assigneeId,
          createdBy:
            adminId ??
            project.projectManagerId ??
            "00000000-0000-0000-0000-000000000000",
          departmentId: defaultDept.id,
          priority: (data.priority as TaskPriority) ?? TaskPriority.NORMAL,
          dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
          status: (data.status as TaskStatus) ?? TaskStatus.TODO,
        },
      });

      await tx.ledger.create({
        data: {
          action: "admin.projects.add-task",
          entity: "project",
          entityId: projectId,
          userId: adminId,
          after: { taskId: created.id, title: data.title },
        },
      });

      return created;
    });

    if (adminId) {
      await this.actionLog.record({
        actorId: adminId,
        targetType: "project",
        targetId: projectId,
        actionType: "admin.projects.add-task",
        afterState: { taskId: task.id, title: data.title },
      });
    }
    this.projectGroupChatService
      .syncParticipants(projectId)
      .catch(() => undefined);

    return task;
  }
}
