import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ProjectStatus, TaskPriority, TaskStatus } from "@hassad/shared";

import { PrismaService } from "../../../prisma/prisma.service";

const pmProjectDetailInclude = Prisma.validator<Prisma.ProjectInclude>()({
  client: { select: { id: true, companyName: true } },
  manager: { select: { id: true, name: true, email: true } },
  contract: { select: { id: true, type: true, totalValue: true, monthlyValue: true } },
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
  constructor(private readonly prisma: PrismaService) {}

  private ownedWhere(userId: string) {
    return {
      projectManagerId: userId,
      isArchived: false,
    };
  }

  async list(userId: string): Promise<{ items: PmProjectCard[] }> {
    const projects = await this.prisma.project.findMany({
      where: this.ownedWhere(userId),
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
    });

    return {
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
    };
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
      throw new NotFoundException("Project not found");
    }

    const invoices = new Map<string, NonNullable<PmProjectDetailRecord["invoiceItems"]>[number]["invoice"]>();
    const payments: NonNullable<NonNullable<PmProjectDetailRecord["invoiceItems"]>[number]["invoice"]["payments"]> = [] as any;

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

    const history = await this.prisma.ledger.findMany({
      where: { entity: "project", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true } } },
    });

    const { invoiceItems, ...rest } = project;

    return {
      ...rest,
      workspaceType: project.contract?.type ?? (project.periods?.length ? "MONTHLY_RETAINER" : "ONE_OFF"),
      hasPeriods: (project.periods?.length ?? 0) > 0,
      currentPeriodId: project.periods?.find((period) => period.status === "ACTIVE")?.id ?? null,
      totalValue: project.contract?.totalValue ?? 0,
      monthlyValue: project.contract?.monthlyValue ?? 0,
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
