import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ProjectStatus, TaskStatus, TaskPriority } from "@hassad/shared";

@Injectable()
export class AdminProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        {
          client: {
            companyName: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }
    if (query.pmId) where.projectManagerId = query.pmId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.overdueOnly === "true") {
      where.tasks = {
        some: {
          dueDate: { lt: new Date() },
          status: { notIn: ["DONE", "REVISION"] },
        },
      };
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
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
        const completedPeriods = p.periods?.filter(
          (per: any) => per.status === "COMPLETED",
        ).length ?? 0;
        const totalPeriods = p.periods?.length ?? 0;
        const totalInvoiced = p.invoiceItems?.reduce(
          (sum: number, item: any) => sum + (item.total ?? 0),
          0,
        ) ?? 0;
        const remainingValue = (p.contract?.totalValue ?? 0) - totalInvoiced;

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
          totalValue: p.contract?.totalValue ?? 0,
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
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        files: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            uploadedBy: true,
            uploadedAt: true,
          },
        },
        meetings: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            notes: true,
            createdBy: true,
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
    if (!project) throw new NotFoundException("Project not found");

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
      totalValue: project.contract?.totalValue ?? 0,
      monthlyValue: project.contract?.monthlyValue ?? 0,
      invoices: Array.from(invoices.values()).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
        paymentMethod: inv.paymentMethod,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
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

  async reassignPm(projectId: string, pmUserId: string) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.user.findUnique({ where: { id: pmUserId } }),
    ]);
    if (!project) throw new NotFoundException("Project not found");
    if (!user) throw new NotFoundException("User not found");

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
          after: { previousPmId: project.projectManagerId, newPmId: pmUserId },
        },
      }),
    ]);
    return { success: true };
  }

  async archive(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");

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
        },
      }),
    ]);
    return { success: true };
  }

  async forceStatus(projectId: string, status: ProjectStatus, reason: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { status },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.projects.force-status",
          entity: "project",
          entityId: projectId,
          after: { previousStatus: project.status, newStatus: status, reason },
        },
      }),
    ]);
    return { success: true };
  }

  async create(data: {
    name: string;
    clientId: string;
    projectManagerId?: string;
    status?: string;
    startDate: string;
    endDate: string;
    description?: string;
    priority?: string;
  }) {
    const project = await this.prisma.project.create({
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

    await this.prisma.ledger.create({
      data: {
        action: "admin.projects.create",
        entity: "project",
        entityId: project.id,
        after: { name: data.name, clientId: data.clientId },
      },
    });

    return project;
  }

  async addMember(projectId: string, userId: string, role: string) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!project) throw new NotFoundException("Project not found");
    if (!user) throw new NotFoundException("User not found");

    const member = await this.prisma.projectMember.create({
      data: { projectId, userId, role: role as any },
    });

    await this.prisma.ledger.create({
      data: {
        action: "admin.projects.add-member",
        entity: "project",
        entityId: projectId,
        after: { userId, role, name: user.name },
      },
    });

    return member;
  }

  async addTask(projectId: string, data: {
    title: string;
    assigneeId?: string;
    priority?: string;
    dueDate?: string;
    status?: string;
  }, adminId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");

    let defaultDept = await this.prisma.department.findFirst({ orderBy: { createdAt: "asc" } });
    if (!defaultDept) {
      defaultDept = await this.prisma.department.create({
        data: { name: "General" },
      });
    }

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title: data.title,
        assignedTo: data.assigneeId,
        createdBy: adminId ?? project.projectManagerId ?? "00000000-0000-0000-0000-000000000000",
        departmentId: defaultDept.id,
        priority: data.priority as TaskPriority ?? TaskPriority.NORMAL,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        status: data.status as TaskStatus ?? TaskStatus.TODO,
      },
    });

    await this.prisma.ledger.create({
      data: {
        action: "admin.projects.add-task",
        entity: "project",
        entityId: projectId,
        after: { taskId: task.id, title: data.title },
      },
    });

    return task;
  }
}
