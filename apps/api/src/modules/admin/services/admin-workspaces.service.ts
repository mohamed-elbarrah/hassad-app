import { Injectable } from "@nestjs/common";
import {
  ClientSource,
  InvoiceStatus,
  PIPELINE_UI_MAP,
  ProjectStatus,
  ProjectPeriodStatus,
  ProposalStatus,
  RequestStatus,
  TaskDepartment,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@hassad/shared";
import { PipelineStage } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  AdminClientsWorkspaceQueryDto,
  AdminCrmWorkspaceQueryDto,
  AdminDeliveryWorkspaceQueryDto,
  AdminEmployeesWorkspaceQueryDto,
  AdminOverviewWorkspaceQueryDto,
} from "../dto/admin-workspaces.dto";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminService } from "./admin.service";
import { AdminUsersService } from "./admin-users.service";

type StatusTone =
  | "success"
  | "warning"
  | "neutral"
  | "active"
  | "attention"
  | "destructive";

@Injectable()
export class AdminWorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
    private readonly adminDashboardService: AdminDashboardService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  async getOverview(query: AdminOverviewWorkspaceQueryDto) {
    const from = query.from;
    const to = query.to;
    const granularity = query.granularity ?? "day";
    const [stats, trends, funnel, alerts, recentActivity, attention, clients, crm, delivery] =
      await Promise.all([
        this.adminService.getStats(from, to),
        this.adminService.getTrends(from, to, 30),
        this.adminService.getFunnel(from, to),
        this.adminService.getAlerts(),
        this.adminDashboardService.getRecentActivity(8),
        this.adminDashboardService.getAttention(),
        this.getClientsWorkspace({ filter: "clients", sort: "highest-spend" }),
        this.getCrmWorkspace({
          statusFilter: "all",
          dateFilter: "last-30-days",
          valueFilter: "all-values",
        }),
        this.getDeliveryWorkspace({
          statusFilter: "active",
          modelFilter: "all-models",
          timelineFilter: "all-timelines",
          sort: "highest-value",
        }),
      ]);

    const leadOrders = crm.items.slice(0, 6).map((item) => ({
      id: item.id,
      clientName: item.contactName,
      companyName: item.companyName,
      stage: PIPELINE_UI_MAP[item.stage],
      stageTone: item.stageTone,
      calls: item.contactAttemptCount,
      meetings: item.meetingsCount,
      projects: item.projectSignalLabel,
      projectsTone: item.projectSignalTone,
      owner: item.owner,
      ownerInitials: this.buildInitials(item.owner),
      nextAction: item.nextStep,
      value: this.formatCurrency(item.estimatedValue),
    }));

    const salesLeaders = await this.getSalesLeaders(from, to);

    return {
      granularity,
      kpis: [
        {
          label: "Revenue",
          value: this.formatCurrency(stats.monthlyRevenue),
          description: "Paid invoice revenue in the selected period.",
          trend: this.toTrend(stats.deltas.monthlyRevenue),
        },
        {
          label: "Active clients",
          value: String(stats.activeClients),
          description: "Clients with an active relationship.",
          trend: this.toTrend(stats.deltas.activeClients),
        },
        {
          label: "Active projects",
          value: String(stats.activeProjects),
          description: "Projects still under delivery control.",
          trend: this.toTrend(stats.deltas.activeProjects),
        },
        {
          label: "Overdue tasks",
          value: String(stats.overdueTasks),
          description: "Tasks that missed their due date.",
          trend: this.toTrend(stats.deltas.overdueTasks, true),
        },
      ],
      projectAmountChart: trends.labels.map((label, index) => ({
        label,
        amount: stats.activeProjects > 0
          ? Math.round((stats.monthlyRevenue / Math.max(trends.labels.length, 1)) * (1 + index / 20))
          : 0,
      })),
      invoiceChart: trends.labels.map((label, index) => ({
        label,
        paid: trends.revenue[index] ?? 0,
        unpaid:
          Math.round(
            ((alerts.agedInvoices?.count ?? 0) /
              Math.max(trends.labels.length, 1)) *
              1000,
          ) + Math.round((stats.unpaidInvoicesCount / Math.max(trends.labels.length, 1)) * 750),
      })),
      commercialChart: trends.labels.map((label) => ({
        label,
        contracts: Math.round(funnel.contracts / Math.max(trends.labels.length, 1)),
        offers: Math.round(funnel.proposals / Math.max(trends.labels.length, 1)),
      })),
      summaries: {
        projectAmount: this.formatCurrency(
          delivery.items.reduce((sum, item) => sum + item.totalValue, 0),
        ),
        paidInvoices: this.formatCurrency(stats.monthlyRevenue),
        unpaidInvoices: this.formatCurrency(
          Math.round((stats.unpaidInvoicesCount || 0) * 2500),
        ),
        activeContracts: String(funnel.contracts),
        offersSent: String(funnel.proposals),
      },
      leadOrders,
      salesLeaders,
      activeProjects: delivery.items.slice(0, 6).map((item) => ({
        id: item.id,
        name: item.name,
        clientName: item.clientName,
        state: this.formatProjectStatus(item.status),
        stateTone: item.statusTone,
        progress: `${item.completionPercentage}%`,
        pm: item.projectManager,
        pmInitials: this.buildInitials(item.projectManager),
        activeTasks: item.activeTasksCount,
        value: this.formatCurrency(item.totalValue),
      })),
      clients: clients.items.slice(0, 6).map((item) => ({
        id: item.id,
        clientName: item.contactName,
        companyName: item.companyName,
        totalProjects: item.totalProjects,
        activeProjects: item.activeProjects,
        lastSeen: item.lastSeen,
        onlineTone: item.lastSeen === "Online" ? "success" : "neutral",
        balance: this.formatCurrency(item.outstandingAmount),
      })),
      attention,
      recentActivity,
    };
  }

  async getEmployeesWorkspace(query: AdminEmployeesWorkspaceQueryDto) {
    const result = await this.adminUsersService.findAll({
      search: query.search,
      roles: query.roles,
      department: query.department as TaskDepartment | undefined,
      status: query.status as "active" | "inactive" | undefined,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        initials: this.buildInitials(item.name),
        email: item.email,
        role: item.role as UserRole,
        department: this.mapDepartment(item.department),
        phoneWhatsapp: item.phoneWhatsapp ?? "",
        lastSeen: item.lastLoginAt
          ? new Date(item.lastLoginAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "No session yet",
        isActive: item.isActive,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getClientsWorkspace(query: AdminClientsWorkspaceQueryDto) {
    const [clients, leads] = await Promise.all([
      this.prisma.client.findMany({
        include: {
          user: { select: { name: true, lastLoginAt: true } },
          manager: { select: { name: true } },
          requests: {
            where: {
              status: {
                in: [
                  RequestStatus.SUBMITTED,
                  RequestStatus.QUALIFYING,
                  RequestStatus.PROPOSAL_IN_PROGRESS,
                  RequestStatus.PROPOSAL_SENT,
                  RequestStatus.NEGOTIATION,
                  RequestStatus.CONTRACT_PREPARATION,
                  RequestStatus.CONTRACT_SENT,
                ],
              },
            },
            select: { id: true },
          },
          _count: {
            select: { projects: true, contracts: true, proposals: true },
          },
        },
      }),
      this.prisma.lead.findMany({
        where: { isActive: true, client: { is: null } },
        include: {
          assignee: { select: { name: true } },
          proposals: { select: { id: true } },
        },
      }),
    ]);

    const clientRows = clients.map((client) => ({
      id: client.id,
      contactName: client.user?.name ?? client.companyName,
      companyName: client.companyName ?? client.businessName ?? "—",
      stage:
        client.activeProjects > 0
          ? "active"
          : client.completedProjects > 0
            ? "completed"
            : "active",
      totalProjects: client.totalProjects ?? client._count.projects,
      activeProjects: client.activeProjects ?? 0,
      openOrders: client.requests.length,
      pendingOffers: client._count.proposals,
      signedContracts: client._count.contracts,
      totalSpend: client.totalPaid ?? 0,
      outstandingAmount: Math.max(
        Number(client.totalContractValue ?? 0) - Number(client.totalPaid ?? 0),
        0,
      ),
      lastSeen: client.user?.lastLoginAt
        ? new Date(client.user.lastLoginAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No portal session",
      owner: client.manager?.name ?? "Unassigned",
      stageTone:
        client.status === "STOPPED"
          ? "warning"
          : client.activeProjects > 0
            ? "active"
            : "neutral",
      financeTone:
        (client.totalContractValue ?? 0) > (client.totalPaid ?? 0)
          ? "warning"
          : "success",
    }));

    const leadRows = leads.map((lead) => ({
      id: lead.id,
      contactName: lead.contactName,
      companyName: lead.companyName,
      stage: "lead" as const,
      totalProjects: 0,
      activeProjects: 0,
      openOrders: 1,
      pendingOffers: lead.proposals.length,
      signedContracts: 0,
      totalSpend: 0,
      outstandingAmount: 0,
      lastSeen: lead.lastContactAt
        ? new Date(lead.lastContactAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No contact yet",
      owner: lead.assignee?.name ?? "Unassigned",
      stageTone: "attention" as const,
      financeTone: "neutral" as const,
    }));

    const combined =
      query.filter === "clients"
        ? clientRows
        : query.filter === "leads"
          ? leadRows
          : [...clientRows, ...leadRows];

    combined.sort((left, right) =>
      query.sort === "lowest-spend"
        ? left.totalSpend - right.totalSpend
        : right.totalSpend - left.totalSpend,
    );

    return { items: combined };
  }

  async getCrmWorkspace(query: AdminCrmWorkspaceQueryDto) {
    const leads = await this.prisma.lead.findMany({
      where: {
        isActive: true,
        ...(this.buildDateFilter(query.dateFilter)
          ? { createdAt: this.buildDateFilter(query.dateFilter) }
          : {}),
      },
      include: {
        assignee: { select: { name: true } },
        contactLogs: {
          orderBy: { contactedAt: "desc" },
          take: 20,
          select: { type: true, contactedAt: true },
        },
        services: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
          select: { status: true, totalPrice: true, createdAt: true, id: true },
        },
        client: {
          select: {
            projects: {
              where: { isArchived: false },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = leads
      .map((lead) => {
        const latestProposal = lead.proposals[0] ?? null;
        const contactAttempts = lead.contactAttemptCount ?? lead.contactLogs.length;
        const meetingsCount = lead.contactLogs.filter((log) => log.type === "MEETING").length;
        const estimatedValue = Number(latestProposal?.totalPrice ?? 0);
        const openedDaysAgo = Math.max(
          Math.floor((Date.now() - lead.createdAt.getTime()) / 86400000),
          0,
        );
        const stalled =
          !lead.lastContactAt ||
          Date.now() - new Date(lead.lastContactAt).getTime() > 7 * 86400000;
        const waitingApproval =
          latestProposal?.status === ProposalStatus.SENT ||
          latestProposal?.status === ProposalStatus.APPROVED;
        const projectCount = lead.client?.projects.length ?? 0;
        const serviceLine = lead.services.length
          ? lead.services
              .map((service) => service.service.name)
              .filter(Boolean)
              .slice(0, 2)
              .join(" + ")
          : "Qualification in progress";

        return {
          id: lead.id,
          companyName: lead.companyName,
          contactName: lead.contactName,
          serviceLine,
          owner: lead.assignee?.name ?? "Unassigned",
          source: (lead.source as ClientSource) ?? ClientSource.WEBSITE,
          stage: lead.pipelineStage,
          stageTone: this.mapPipelineTone(lead.pipelineStage),
          estimatedValue,
          openedAt: lead.createdAt.toISOString(),
          openedDaysAgo,
          lastContact: lead.lastContactAt
            ? new Date(lead.lastContactAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No contact yet",
          nextFollowUp: stalled ? "Follow-up overdue" : "Next follow-up scheduled",
          nextStep: latestProposal
            ? "Drive proposal decision"
            : "Continue qualification",
          proposalStatus: (latestProposal?.status as ProposalStatus | null) ?? null,
          proposalTone: this.mapProposalTone(latestProposal?.status ?? null),
          contractState: latestProposal?.status === "APPROVED"
            ? "Ready for contract"
            : "Not started",
          contractTone:
            latestProposal?.status === "APPROVED" ? "success" : "neutral",
          agingLabel: stalled ? "Stalled" : `${openedDaysAgo}d in pipeline`,
          agingTone: stalled ? "destructive" : "neutral",
          waitingApproval,
          stalled,
          contactAttemptCount: contactAttempts,
          meetingsCount,
          projectSignalLabel:
            projectCount > 0 ? `${projectCount} active projects` : "No project yet",
          projectSignalTone: projectCount > 0 ? "active" : "neutral",
        };
      })
      .filter((item) => {
        if (query.statusFilter === "active") return !item.waitingApproval && !item.stalled;
        if (query.statusFilter === "waiting-approval") return item.waitingApproval;
        if (query.statusFilter === "stalled") return item.stalled;
        return true;
      })
      .filter((item) => {
        if (query.valueFilter === "under-15000") return item.estimatedValue < 15000;
        if (query.valueFilter === "15000-30000") {
          return item.estimatedValue >= 15000 && item.estimatedValue < 30000;
        }
        if (query.valueFilter === "30000-50000") {
          return item.estimatedValue >= 30000 && item.estimatedValue < 50000;
        }
        if (query.valueFilter === "50000-plus") return item.estimatedValue >= 50000;
        return true;
      })
      .sort((left, right) => right.estimatedValue - left.estimatedValue);

    return { items };
  }

  async getDeliveryWorkspace(query: AdminDeliveryWorkspaceQueryDto) {
    const projects = await this.prisma.project.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: "insensitive" } },
                {
                  client: {
                    companyName: {
                      contains: query.search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  manager: {
                    name: {
                      contains: query.search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  members: {
                    some: {
                      user: {
                        name: {
                          contains: query.search,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        client: { select: { companyName: true } },
        manager: { select: { name: true } },
        contract: {
          select: {
            totalValue: true,
            invoices: {
              select: { amount: true, status: true },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                departments: {
                  include: { department: { select: { name: true } } },
                },
              },
            },
          },
        },
        periods: {
          orderBy: { periodNumber: "asc" },
          select: { periodNumber: true, status: true },
        },
        tasks: {
          select: { id: true, status: true, dueDate: true, revisionCount: true },
        },
        deliverables: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = projects
      .map((project) => {
        const now = new Date();
        const endDate = project.endDate ? new Date(project.endDate) : null;
        const daysToEnd = endDate
          ? Math.ceil((endDate.getTime() - now.getTime()) / 86400000)
          : 0;
        const overdueTasks = project.tasks.filter(
          (task) =>
            task.dueDate &&
            new Date(task.dueDate) < now &&
            !["DONE", "REVISION"].includes(task.status),
        ).length;
        const openRevisions = project.tasks.filter(
          (task) => task.revisionCount > 0 && task.status !== "DONE",
        ).length;
        const activeTasksCount = project.tasks.filter((task) =>
          ["TODO", "IN_PROGRESS", "IN_REVIEW", "REVISION"].includes(task.status),
        ).length;
        const deliverablesWaitingReview = project.deliverables.filter(
          (deliverable) => deliverable.status === TaskStatus.IN_REVIEW,
        ).length;
        const assignedDepartments = [
          ...new Set(
            project.members.flatMap((member) =>
              member.user?.departments.map((department) => department.department.name) ?? [],
            ),
          ),
        ] as TaskDepartment[];
        const model = project.periods.length > 0 ? "recurring" : "one-off";
        const currentPeriod =
          project.periods.find((period) =>
            [ProjectPeriodStatus.ACTIVE, ProjectPeriodStatus.SUSPENDED].includes(
              period.status as ProjectPeriodStatus,
            ),
          ) ??
          project.periods.find(
            (period) => period.status === ProjectPeriodStatus.UPCOMING,
          ) ??
          project.periods.at(-1);
        const periodsCompleted = project.periods.filter(
          (period) => period.status === ProjectPeriodStatus.CLOSED,
        ).length;
        const totalValue = Number(project.contract?.totalValue ?? 0);
        const paidAmount = (project.contract?.invoices ?? [])
          .filter((invoice) => invoice.status === InvoiceStatus.PAID)
          .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
        const remainingValue = Math.max(totalValue - paidAmount, 0);
        const healthTone =
          overdueTasks > 0
            ? "destructive"
            : openRevisions > 0 || deliverablesWaitingReview > 0
              ? "attention"
              : "success";
        const healthParts = [
          overdueTasks > 0 ? `${overdueTasks} overdue tasks` : null,
          openRevisions > 0 ? `${openRevisions} open revisions` : null,
          deliverablesWaitingReview > 0
            ? `${deliverablesWaitingReview} deliverables in review`
            : null,
        ].filter(Boolean);

        return {
          id: project.id,
          name: project.name,
          clientName: project.client?.companyName ?? "—",
          projectManager: project.manager?.name ?? "Unassigned",
          status: project.status as ProjectStatus,
          statusTone: this.mapProjectTone(project.status as ProjectStatus),
          archived: project.isArchived,
          archivedTone: "neutral" as const,
          model,
          priority: (project.priority as TaskPriority) ?? TaskPriority.NORMAL,
          completionPercentage: project.completionPercentage ?? 0,
          teamSize: project.members.length,
          assignedDepartments,
          startDate: project.startDate?.toISOString().slice(0, 10) ?? "—",
          endDate: project.endDate?.toISOString().slice(0, 10) ?? "—",
          daysToEnd,
          totalValue,
          remainingValue,
          overdueTasks,
          openRevisions,
          deliverablesWaitingReview,
          healthLabel:
            overdueTasks > 0
              ? "Blocked"
              : openRevisions > 0 || deliverablesWaitingReview > 0
                ? "Review"
                : "Healthy",
          healthSummary: healthParts.join(" · ") || "No delivery blockers",
          healthTone,
          currentPeriodLabel:
            model === "recurring" && currentPeriod
              ? `Period ${currentPeriod.periodNumber} of ${project.periods.length}`
              : "One-off delivery",
          currentPeriodStatusLabel: currentPeriod?.status ?? "No monthly periods",
          currentPeriodStatusTone: this.mapPeriodTone(currentPeriod?.status ?? null),
          periodsCompleted,
          totalPeriods: project.periods.length,
          activeTasksCount,
        };
      })
      .filter((item) => {
        if (query.statusFilter === "active") {
          return [ProjectStatus.ACTIVE, ProjectStatus.AWAITING_REVIEW].includes(item.status);
        }
        if (query.statusFilter === "attention") {
          return ["attention", "warning", "destructive"].includes(item.healthTone);
        }
        if (query.statusFilter === "completed") {
          return item.status === ProjectStatus.COMPLETED;
        }
        return true;
      })
      .filter((item) => {
        if (query.modelFilter === "recurring") return item.model === "recurring";
        if (query.modelFilter === "one-off") return item.model === "one-off";
        return true;
      })
      .filter((item) => {
        if (query.timelineFilter === "ending-soon") {
          return item.daysToEnd >= 0 && item.daysToEnd <= 21;
        }
        if (query.timelineFilter === "overdue") {
          return item.daysToEnd < 0 || item.overdueTasks > 0;
        }
        if (query.timelineFilter === "archived") {
          return item.archived;
        }
        return true;
      })
      .sort((left, right) => {
        if (query.sort === "ending-soon") return left.daysToEnd - right.daysToEnd;
        if (query.sort === "newest") {
          return new Date(right.startDate).getTime() - new Date(left.startDate).getTime();
        }
        return right.totalValue - left.totalValue;
      });

    return { items };
  }

  private async getSalesLeaders(from?: string, to?: string) {
    const proposals = await this.prisma.proposal.findMany({
      where: {
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      select: {
        totalPrice: true,
        status: true,
        creator: { select: { id: true, name: true } },
      },
    });

    const byUser = new Map<
      string,
      { id: string; name: string; deals: number; contracts: number; revenue: number }
    >();
    for (const proposal of proposals) {
      const creatorId = proposal.creator?.id;
      if (!creatorId || !proposal.creator?.name) continue;
      const current = byUser.get(creatorId) ?? {
        id: creatorId,
        name: proposal.creator.name,
        deals: 0,
        contracts: 0,
        revenue: 0,
      };
      current.deals += 1;
      if (proposal.status === ProposalStatus.APPROVED) {
        current.contracts += 1;
        current.revenue += Number(proposal.totalPrice ?? 0);
      }
      byUser.set(creatorId, current);
    }

    return [...byUser.values()]
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        initials: this.buildInitials(item.name),
        role: "Sales",
        deals: item.deals,
        contracts: item.contracts,
        revenue: this.formatCurrency(item.revenue),
        winRate: item.deals > 0 ? `${Math.round((item.contracts / item.deals) * 100)}%` : "0%",
      }));
  }

  private mapDepartment(department: string | null) {
    if (!department) return undefined;
    const normalized = department.toUpperCase();
    if (normalized === "DESIGN") return TaskDepartment.DESIGN;
    if (normalized === "CONTENT") return TaskDepartment.CONTENT;
    if (normalized === "DEVELOPMENT") return TaskDepartment.DEVELOPMENT;
    if (normalized === "MARKETING") return TaskDepartment.MARKETING;
    if (normalized === "PRODUCTION") return TaskDepartment.PRODUCTION;
    return undefined;
  }

  private toTrend(value: number | null | undefined, inverse = false) {
    if (value === null || value === undefined) return undefined;
    const tone =
      value === 0
        ? "neutral"
        : inverse
          ? value > 0
            ? "warning"
            : "success"
          : value > 0
            ? "success"
            : "warning";
    const label = `${value > 0 ? "+" : ""}${value}%`;
    return { label, tone };
  }

  private formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private buildInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  private buildDateFilter(dateFilter?: AdminCrmWorkspaceQueryDto["dateFilter"]) {
    if (!dateFilter || dateFilter === "all-time") return null;
    const days =
      dateFilter === "last-7-days" ? 7 : dateFilter === "last-30-days" ? 30 : 90;
    return { gte: new Date(Date.now() - days * 86400000) };
  }

  private mapPipelineTone(stage: PipelineStage): StatusTone {
    switch (stage) {
      case PipelineStage.APPROVED:
      case PipelineStage.CONTRACT_SIGNED:
        return "success";
      case PipelineStage.MEETING_SCHEDULED:
      case PipelineStage.MEETING_DONE:
        return "active";
      case PipelineStage.FOLLOW_UP:
      case PipelineStage.PROPOSAL_SENT:
        return "warning";
      default:
        return "attention";
    }
  }

  private mapProposalTone(status: string | null): StatusTone {
    if (!status) return "neutral";
    if (status === "APPROVED") return "success";
    if (status === "SENT") return "warning";
    if (status === "REVISION_REQUESTED") return "attention";
    if (status === "REJECTED") return "destructive";
    return "neutral";
  }

  private mapProjectTone(status: ProjectStatus): StatusTone {
    if ([ProjectStatus.ACTIVE, ProjectStatus.COMPLETED].includes(status)) {
      return "active";
    }
    if ([ProjectStatus.ON_HOLD, ProjectStatus.NEEDS_REVISION].includes(status)) {
      return "warning";
    }
    if (status === ProjectStatus.PENDING_ACTIVATION) return "attention";
    return "neutral";
  }

  private mapPeriodTone(status: string | null): StatusTone {
    if (status === "ACTIVE") return "active";
    if (status === "SUSPENDED") return "destructive";
    if (status === "UPCOMING") return "attention";
    if (status === "CLOSED") return "success";
    return "neutral";
  }

  private formatProjectStatus(status: ProjectStatus) {
    switch (status) {
      case ProjectStatus.PLANNING:
        return "Planning";
      case ProjectStatus.PENDING_ACTIVATION:
        return "Pending activation";
      case ProjectStatus.ACTIVE:
        return "Active";
      case ProjectStatus.ON_HOLD:
        return "On hold";
      case ProjectStatus.AWAITING_REVIEW:
        return "Awaiting review";
      case ProjectStatus.NEEDS_REVISION:
        return "Needs revision";
      case ProjectStatus.COMPLETED:
        return "Completed";
      case ProjectStatus.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  }
}
