import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ProjectStatus, TaskPriority, TaskStatus } from "@hassad/shared";

import { PrismaService } from "../../../prisma/prisma.service";
import { ProjectsService } from "../../projects/services/projects.service";
import type {
  PmProjectsQueryDto,
  PmProjectUpdateDto,
} from "../dto/pm-projects.dto";

const pmProjectDetailInclude = Prisma.validator<Prisma.ProjectInclude>()({
  client: { select: { id: true, companyName: true } },
  manager: { select: { id: true, name: true, email: true } },
  contract: {
    select: { id: true, type: true, totalValue: true, monthlyValue: true },
  },
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
    take: 50,
  },
  files: {
    select: {
      id: true,
      fileName: true,
      filePath: true,
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
});

const pmProjectListTasksSelect = {
  id: true,
  status: true,
  dueDate: true,
  priority: true,
} as const;

type PmProjectDetailRecord = Prisma.ProjectGetPayload<{
  include: typeof pmProjectDetailInclude;
}>;

export type PmProjectCard = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  completionPercentage: number;
  startDate: string;
  endDate: string;
  projectManager: {
    id: string;
    name: string;
  } | null;
  priority: TaskPriority;
  taskCount: number;
  overdueTaskCount: number;
  activeTaskCount: number;
  updatedAt: string;
};

@Injectable()
export class PmProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  private ownedWhere(userId: string) {
    return {
      projectManagerId: userId,
      isArchived: false,
    };
  }

  async list(
    userId: string,
    query: PmProjectsQueryDto,
  ): Promise<{
    __standardResponse: true;
    data: { items: PmProjectCard[] };
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const search = query.search?.trim();
    const where = {
      ...this.ownedWhere(userId),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              {
                client: {
                  companyName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          completionPercentage: true,
          startDate: true,
          endDate: true,
          updatedAt: true,
          manager: {
            select: {
              id: true,
              name: true,
            },
          },
          client: {
            select: {
              companyName: true,
            },
          },
          tasks: {
            select: pmProjectListTasksSelect,
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      __standardResponse: true as const,
      data: {
        items: projects.map((project) => {
          const taskCount = project.tasks.length;
          const overdueTaskCount = project.tasks.filter(
            (task) =>
              task.dueDate &&
              task.dueDate < new Date() &&
              task.status !== TaskStatus.DONE,
          ).length;
          const activeTaskCount = project.tasks.filter((task) =>
            [
              TaskStatus.TODO,
              TaskStatus.IN_PROGRESS,
              TaskStatus.IN_REVIEW,
              TaskStatus.REVISION,
            ].includes(task.status as TaskStatus),
          ).length;

          return {
            id: project.id,
            name: project.name,
            clientName: project.client.companyName,
            status: project.status as ProjectStatus,
            completionPercentage: project.completionPercentage,
            startDate: project.startDate.toISOString(),
            endDate: project.endDate.toISOString(),
            projectManager: project.manager,
            priority: project.priority as TaskPriority,
            taskCount,
            overdueTaskCount,
            activeTaskCount,
            updatedAt: project.updatedAt.toISOString(),
          };
        }),
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(userId: string, id: string, dto: PmProjectUpdateDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        details: { fields: { project: { code: "REQUIRED" } } },
      });
    }

    const project = await this.prisma.project.findFirst({
      where: { id, ...this.ownedWhere(userId) },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId: id },
      });
    }

    return this.projectsService.update(id, dto);
  }

  async updateStatus(userId: string, id: string, status: ProjectStatus) {
    const project = await this.prisma.project.findFirst({
      where: { id, ...this.ownedWhere(userId) },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId: id },
      });
    }

    return this.projectsService.updateStatus(id, status, userId);
  }

  async detail(userId: string, id: string) {
    return this.workspace(userId, id);
  }

  async workspace(userId: string, id: string) {
    const project = (await this.prisma.project.findFirst({
      where: { id, ...this.ownedWhere(userId) },
      include: pmProjectDetailInclude,
    })) as PmProjectDetailRecord | null;

    if (!project) {
      throw new NotFoundException({
        code: "PROJECT_NOT_FOUND",
        details: { projectId: id },
      });
    }

    const invoices = new Map<
      string,
      NonNullable<PmProjectDetailRecord["invoiceItems"]>[number]["invoice"]
    >();
    type ProjectPayment = NonNullable<
      NonNullable<PmProjectDetailRecord["invoiceItems"]>[number]["invoice"]
    >["payments"][number];
    const payments: ProjectPayment[] = [];

    for (const item of project.invoiceItems ?? []) {
      if (item.invoice && !invoices.has(item.invoice.id)) {
        invoices.set(item.invoice.id, item.invoice);
      }
    }

    for (const inv of invoices.values()) {
      for (const payment of inv.payments ?? []) {
        payments.push(payment);
      }
    }

    const [taskCounts, overdueTaskCount, upcomingTasks] = await Promise.all([
      this.prisma.task.groupBy({
        by: ["status"],
        where: { projectId: id },
        _count: { status: true },
      }),
      this.prisma.task.count({
        where: {
          projectId: id,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
      this.prisma.task.findMany({
        where: {
          projectId: id,
          status: { not: TaskStatus.DONE },
          dueDate: { not: null },
        },
        select: { id: true, title: true, dueDate: true, status: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
    ]);
    const taskStats = {
      total: taskCounts.reduce((sum, item) => sum + item._count.status, 0),
      completed:
        taskCounts.find((item) => item.status === TaskStatus.DONE)?._count
          .status ?? 0,
      inProgress:
        taskCounts.find((item) => item.status === TaskStatus.IN_PROGRESS)
          ?._count.status ?? 0,
      overdue: overdueTaskCount,
    };

    const history = await this.prisma.ledger.findMany({
      where: { entity: "project", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true } } },
    });

    const { invoiceItems: _invoiceItems, ...rest } = project;
    void _invoiceItems;

    return {
      ...rest,
      workspaceType:
        project.contract?.type ??
        (project.periods?.length ? "MONTHLY_RETAINER" : "ONE_OFF"),
      hasPeriods: (project.periods?.length ?? 0) > 0,
      currentPeriodId:
        project.periods?.find((period) => period.status === "ACTIVE")?.id ??
        null,
      totalValue: project.contract?.totalValue ?? 0,
      monthlyValue: project.contract?.monthlyValue ?? 0,
      taskStats,
      upcomingTasks: upcomingTasks.map((task) => ({
        ...task,
        dueDate: task.dueDate?.toISOString() ?? "",
      })),
      capabilities: {
        canAssignTasks: true,
        canScheduleMeetings: true,
        canUploadFiles: true,
        canManagePeriods: (project.periods?.length ?? 0) > 0,
      },
      invoices: Array.from(invoices.values()).map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
        paymentMethod: inv.paymentMethod,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.method,
        status: payment.status,
        createdAt: payment.createdAt.toISOString(),
      })),
      history: history.map((entry) => ({
        id: entry.id,
        action: entry.action,
        userId: entry.userId,
        userName: entry.user?.name ?? "—",
        before: entry.before,
        after: entry.after,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }
}
