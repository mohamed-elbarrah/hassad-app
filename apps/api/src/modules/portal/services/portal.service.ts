import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

/** Shape of `getContractById` — derived from Prisma's generated types so it
 *  stays in sync with the actual `include` inside the method. (Audit #14) */
export type PortalContractDetail = Prisma.ContractGetPayload<{
  include: {
    client: { select: { id: true; companyName: true } };
    proposal: true;
    invoices: { include: { items: true; payments: true } };
    request: { select: { id: true; status: true } };
  };
}>;
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ClientCounterService } from "../../crm/services/client-counter.service";
import {
  CreateDeliverableDto,
  CreateRevisionDto,
  CreateIntakeFormDto,
  SaveDraftDto,
  RequestProjectRevisionDto,
} from "../dto/portal.dto";
import {
  TaskStatus,
  ContractStatus,
  InvoiceStatus,
  ProposalStatus,
  ProjectStatus,
  CampaignStatus,
  PROJECT_STATUS_AR,
} from "@hassad/shared";
import { randomBytes } from "crypto";
import { StorageService } from "../../../common/storage/storage.service";
import { MarketingStrategyService } from "../../marketing/services/marketing-strategy.service";

const TASK_STATUS_AR_MAP: Record<string, string> = {
  TODO: "لم يبدأ",
  IN_PROGRESS: "جاري العمل",
  IN_REVIEW: "قيد المراجعة",
  DONE: "مكتمل",
  REVISION: "تعديل مطلوب",
};

@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
    private marketingStrategyService: MarketingStrategyService,
    private clientCounterService: ClientCounterService,
  ) {}

  /** Broadcast invalidations to client's WebSocket connections (NEW) */
  private async broadcastInvalidations(clientId: string, tags: string[]) {
    await this.notificationsService.broadcastPortalInvalidations(
      clientId,
      tags,
    );
  }

  private getPendingRequestStageLabel(status: string) {
    switch (status) {
      case "PROPOSAL_IN_PROGRESS":
        return "يتم إعداد العرض الفني لطلبك.";
      case "PROPOSAL_SENT":
      case "NEGOTIATION":
        return "العرض الفني متاح الآن للمراجعة والمتابعة.";
      case "CONTRACT_PREPARATION":
        return "يتم تجهيز العقد والملف المالي.";
      case "CONTRACT_SENT":
        return "العقد جاهز للتوقيع من خلال البوابة.";
      case "SIGNED":
        return "تم توقيع العقد وجارٍ تحويل الطلب إلى مشروع.";
      case "QUALIFYING":
      case "SUBMITTED":
      default:
        return "طلبك قيد المراجعة من فريق المبيعات.";
    }
  }

  async getDashboard(clientId: string) {
    const [contracts, invoices, projects, campaigns] = await Promise.all([
      this.prisma.contract.findMany({
        where: {
          clientId,
          status: {
            in: [
              ContractStatus.SENT,
              ContractStatus.SIGNED,
              ContractStatus.ACTIVE,
            ],
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          totalValue: true,
          startDate: true,
          endDate: true,
          proposalId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.invoice.findMany({
        where: { clientId },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          dueDate: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.project.findMany({
        where: { clientId },
        select: { id: true, name: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.campaign.findMany({
        where: { clientId, isArchived: false },
        select: { id: true, name: true, status: true, platform: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalContractValue = contracts.reduce(
      (sum, c) => sum + c.totalValue,
      0,
    );
    const unpaidInvoices = invoices.filter(
      (i) =>
        i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED,
    );
    const totalOutstanding = unpaidInvoices.reduce(
      (sum, i) => sum + i.amount,
      0,
    );

    const projectProgress = await this.getProjectProgress(clientId);

    return {
      summary: {
        totalContracts: contracts.length,
        totalContractValue,
        totalOutstanding,
        activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
        activeCampaigns: campaigns.filter(
          (c) => c.status === CampaignStatus.ACTIVE,
        ).length,
      },
      recentContracts: contracts,
      recentInvoices: invoices,
      recentProjects: projects,
      recentCampaigns: campaigns,
      projectProgress,
    };
  }

  /**
   * Get all team members responsible for client's projects and requests
   * Includes: Sales reps from requests and PMs from projects
   */
  async getClientTeamMembers(clientId: string) {
    // Get the client with their user account
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        userId: true,
        accountManager: true,
      },
    });

    if (!client) {
      return { members: [] };
    }

    const members: Array<{
      id: string;
      name: string;
      role: string;
      roleType: "SALES" | "PM" | "ACCOUNT_MANAGER";
      isOnline: boolean;
      avatarUrl?: string | null;
    }> = [];

    // Get all requests with assigned sales reps
    const requests = await this.prisma.request.findMany({
      where: { clientId },
      select: {
        assignedSalesId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            isActive: true,
            avatarUrl: true,
          },
        },
      },
      distinct: ["assignedSalesId"],
    });

    // Add sales reps
    const salesIds = new Set<string>();
    for (const request of requests) {
      if (
        request.assignee &&
        request.assignedSalesId &&
        !salesIds.has(request.assignedSalesId)
      ) {
        salesIds.add(request.assignedSalesId);
        members.push({
          id: request.assignee.id,
          name: request.assignee.name,
          role: "المشرف",
          roleType: "SALES",
          isOnline: request.assignee.isActive ?? false,
          avatarUrl: request.assignee.avatarUrl,
        });
      }
    }

    // Get account manager from client if exists and is different from sales reps
    if (client.accountManager) {
      const accountManagerUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: client.accountManager },
            { name: { contains: client.accountManager, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          avatarUrl: true,
        },
      });

      if (accountManagerUser && !salesIds.has(accountManagerUser.id)) {
        members.push({
          id: accountManagerUser.id,
          name: accountManagerUser.name,
          role: "مدير الحساب",
          roleType: "ACCOUNT_MANAGER",
          isOnline: accountManagerUser.isActive ?? false,
          avatarUrl: accountManagerUser.avatarUrl,
        });
      }
    }

    // Get all project managers from projects
    const projects = await this.prisma.project.findMany({
      where: { clientId, isArchived: false },
      select: {
        projectManagerId: true,
        manager: {
          select: {
            id: true,
            name: true,
            isActive: true,
            avatarUrl: true,
          },
        },
      },
      distinct: ["projectManagerId"],
    });

    // Add PMs
    const pmIds = new Set<string>();
    for (const project of projects) {
      if (
        project.manager &&
        project.projectManagerId &&
        !pmIds.has(project.projectManagerId)
      ) {
        pmIds.add(project.projectManagerId);
        // Check if this PM is not already added as sales/account manager
        if (!salesIds.has(project.projectManagerId)) {
          members.push({
            id: project.manager.id,
            name: project.manager.name,
            role: "مدير المشروع",
            roleType: "PM",
            isOnline: project.manager.isActive ?? false,
            avatarUrl: project.manager.avatarUrl,
          });
        }
      }
    }

    return { members };
  }

  async getProjectProgress(clientId: string) {
    const projects = await this.prisma.project.findMany({
      where: { clientId, isArchived: false },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        projectManagerId: true,
        manager: {
          select: { id: true, name: true, isActive: true },
        },
        completionPercentage: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (projects.length === 0) return null;

    const projectList = projects.map((p) => {
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        statusAr:
          PROJECT_STATUS_AR[p.status as keyof typeof PROJECT_STATUS_AR] ??
          p.status,
        progress: p.completionPercentage,
        startDate: p.startDate,
        endDate: p.endDate,
        projectManager: p.manager
          ? {
              id: p.manager.id,
              name: p.manager.name,
              isOnline: p.manager.isActive,
            }
          : null,
      };
    });

    const overallProgress =
      projectList.length > 0
        ? Math.round(
            projectList.reduce((s, p) => s + p.progress, 0) /
              projectList.length,
          )
        : 0;

    const totalProjects = projectList.length;
    const activeProjects = projectList.filter(
      (p) => p.status === ProjectStatus.ACTIVE,
    ).length;

    return {
      projects: projectList,
      overallProgress,
      totalProjects,
      activeProjects,
    };
  }

  async getProjects(
    clientId: string,
    query: { status?: string; page: number; limit: number },
  ) {
    const where: any = { clientId, isArchived: false };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          completionPercentage: true,
          manager: {
            select: { id: true, name: true, isActive: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    const items = data.map((p) => {
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        statusAr:
          PROJECT_STATUS_AR[p.status as keyof typeof PROJECT_STATUS_AR] ??
          p.status,
        progress: p.completionPercentage,
        startDate: p.startDate,
        endDate: p.endDate,
        projectManager: p.manager
          ? {
              id: p.manager.id,
              name: p.manager.name,
              isOnline: p.manager.isActive,
            }
          : null,
      };
    });

    return { data: items, total, page: query.page, limit: query.limit };
  }

  /** Client-facing monthly period timeline for a retainer project. */
  async getProjectPeriods(clientId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    // Consistent 404 for both not-found and not-owned, so callers can't
    // distinguish the two (prevents IDOR probing). (Audit issue #9)
    if (!project || project.clientId !== clientId) {
      throw new NotFoundException("Project not found");
    }

    const periods = await this.prisma.projectPeriod.findMany({
      where: { projectId },
      orderBy: { periodNumber: "asc" },
      select: {
        id: true,
        periodNumber: true,
        startDate: true,
        endDate: true,
        status: true,
        summary: true,
        reportFilePath: true,
        completionPercentage: true,
        goals: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            issueDate: true,
            dueDate: true,
            payments: { select: { amount: true, status: true } },
          },
        },
        files: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            filePath: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
        meetings: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            durationMin: true,
            location: true,
            meetingLink: true,
            status: true,
            notes: true,
          },
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    if (periods.length === 0) return [];

    // Presign all file URLs in one batch (covers period files).
    const allFileKeys = periods
      .flatMap((p) => p.files.map((f) => f.filePath))
      .filter(Boolean);
    const fileUrlMap =
      allFileKeys.length > 0
        ? await this.storageService.getMultiplePresignedUrls(allFileKeys)
        : new Map<string, string>();

    return periods.map((period) => {
      const goals = this.normalizeGoals(period.goals as any);
      const goalsTotal = goals.length;
      const goalsCompleted = goals.filter((g) => g.status === "done").length;

      const paidAmount =
        period.invoice?.payments
          ?.filter((p) => p.status === "SUCCESS")
          .reduce((sum, p) => sum + p.amount, 0) ?? 0;
      const invoice = period.invoice
        ? {
            id: period.invoice.id,
            invoiceNumber: period.invoice.invoiceNumber,
            amount: period.invoice.amount,
            status: period.invoice.status,
            issueDate: period.invoice.issueDate,
            dueDate: period.invoice.dueDate,
            paidAmount,
            remainingAmount: Math.max(0, period.invoice.amount - paidAmount),
          }
        : null;

      const files = period.files.map((f) => ({
        ...f,
        url: fileUrlMap.get(f.filePath) ?? null,
      }));

      const upcomingMeeting = period.meetings
        .filter((m) => m.status === "SCHEDULED" || m.status === "RESCHEDULED")
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
        .find((m) => m.scheduledAt.getTime() >= Date.now());

      return {
        id: period.id,
        periodNumber: period.periodNumber,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        summary: period.summary,
        reportFilePath: period.reportFilePath,
        completionPercentage: period.completionPercentage,
        goals,
        files,
        invoice,
        meetings: period.meetings,
        stats: {
          goalsTotal,
          goalsCompleted,
          filesCount: period.files.length,
          reportsCount: period.reportFilePath ? 1 : 0,
          hasReport: Boolean(period.reportFilePath),
          nextMeeting: upcomingMeeting
            ? {
                id: upcomingMeeting.id,
                title: upcomingMeeting.title,
                scheduledAt: upcomingMeeting.scheduledAt,
                status: upcomingMeeting.status,
              }
            : null,
        },
      };
    });
  }

  /** Normalize free-form Json goals into the canonical PeriodGoal shape. */
  private normalizeGoals(raw: any): Array<{
    title: string;
    description?: string;
    progress: number;
    status: "done" | "in_progress" | "pending";
  }> {
    if (!Array.isArray(raw)) return [];
    return raw.map((g: any) => {
      const progress =
        typeof g?.progress === "number"
          ? Math.max(0, Math.min(100, g.progress))
          : g?.completed
            ? 100
            : 0;
      const status =
        g?.status === "done" ||
        g?.status === "in_progress" ||
        g?.status === "pending"
          ? g.status
          : progress >= 100
            ? "done"
            : progress > 0
              ? "in_progress"
              : "pending";
      return {
        title: g?.title ?? "",
        description: g?.description ?? undefined,
        progress,
        status,
      };
    });
  }

  /** Portal project detail (header info: name, client, PM, status, dates). */
  async getProjectDetail(clientId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        startDate: true,
        endDate: true,
        completionPercentage: true,
        createdAt: true,
        updatedAt: true,
        manager: { select: { id: true, name: true, isActive: true } },
        client: {
          select: {
            id: true,
            companyName: true,
            user: { select: { name: true, email: true, phoneWhatsapp: true } },
          },
        },
      },
    });
    if (!project || project.client.id !== clientId) {
      throw new NotFoundException("Project not found or access denied");
    }
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      statusAr:
        PROJECT_STATUS_AR[project.status as keyof typeof PROJECT_STATUS_AR] ??
        project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      completionPercentage: project.completionPercentage,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      manager: project.manager
        ? {
            id: project.manager.id,
            name: project.manager.name,
            isOnline: project.manager.isActive,
          }
        : null,
      client: {
        id: project.client.id,
        companyName: project.client.companyName,
        contactName: project.client.user?.name ?? null,
        email: project.client.user?.email ?? null,
        phoneWhatsapp: project.client.user?.phoneWhatsapp ?? null,
      },
    };
  }

  /** Client-scoped invoice detail (no PDF — PDF deferred to a later phase). */
  async getInvoiceDetail(clientId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, clientId },
      include: {
        contract: { select: { id: true, title: true } },
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
        payments: {
          select: { id: true, amount: true, status: true, createdAt: true },
        },
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    const paidAmount = invoice.payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      ...invoice,
      paidAmount,
      remainingAmount: Math.max(0, invoice.amount - paidAmount),
    };
  }

  /** Resolve a presigned download URL for a period report (client-scoped). */
  async getPeriodReportDownloadUrl(clientId: string, periodId: string) {
    const period = await this.prisma.projectPeriod.findUnique({
      where: { id: periodId },
      select: {
        reportFilePath: true,
        project: { select: { clientId: true } },
      },
    });
    if (
      !period ||
      period.project.clientId !== clientId ||
      !period.reportFilePath
    ) {
      throw new NotFoundException("Report not available");
    }
    // Use the existence-checked presigner: a stale `reportFilePath` (e.g.
    // file deleted from R2 but DB row still pointing at it) used to silently
    // return a 403-producing URL. Now we throw a clean 404 instead.
    // (Audit issue #17)
    const url = await this.storageService.getPresignedUrlIfExists(
      period.reportFilePath,
    );
    if (!url) throw new NotFoundException("Report file is no longer available");
    return { url };
  }

  /** Resolve a presigned download URL for a single period file (client-scoped). */
  async getPeriodFileDownloadUrl(clientId: string, fileId: string) {
    const file = await this.prisma.projectFile.findUnique({
      where: { id: fileId },
      include: { project: { select: { clientId: true } } },
    });
    if (!file || file.project.clientId !== clientId) {
      throw new NotFoundException("File not found");
    }
    const url = await this.storageService.getPresignedUrlIfExists(
      file.filePath,
    );
    if (!url) throw new NotFoundException("File is no longer available");
    return { url };
  }

  async getRequests(clientId: string, query: { page: number; limit: number }) {
    const where: any = {
      clientId,
      status: { notIn: ["PROJECT_CREATED", "CANCELLED"] },
    };

    const [data, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          phoneWhatsapp: true,
          email: true,
          notes: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          services: {
            select: {
              id: true,
              quantity: true,
              service: { select: { id: true, name: true, nameAr: true } },
            },
          },
          proposals: {
            select: {
              id: true,
              title: true,
              status: true,
              shareLinkToken: true,
              sentAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          contracts: {
            select: {
              id: true,
              title: true,
              status: true,
              shareLinkToken: true,
              signedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.request.count({ where }),
    ]);

    const items = data.map((request) => {
      const latestProposal = request.proposals[0] ?? null;
      const latestContract = request.contracts[0] ?? null;

      return {
        id: request.id,
        companyName: request.companyName,
        contactName: request.contactName,
        notes: request.notes,
        status: request.status,
        statusLabel: "طلب قيد الانتظار",
        stageLabel: this.getPendingRequestStageLabel(request.status),
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        services: request.services.map((service) => ({
          id: service.id,
          quantity: service.quantity,
          name: service.service.name,
          nameAr: service.service.nameAr,
        })),
        latestProposal: latestProposal
          ? {
              id: latestProposal.id,
              title: latestProposal.title,
              status: latestProposal.status,
              sentAt: latestProposal.sentAt,
              url: latestProposal.shareLinkToken
                ? `/portal/proposals/${latestProposal.shareLinkToken}`
                : null,
            }
          : null,
        latestContract: latestContract
          ? {
              id: latestContract.id,
              title: latestContract.title,
              status: latestContract.status,
              signedAt: latestContract.signedAt,
              url: latestContract.shareLinkToken
                ? `/portal/contracts/${latestContract.shareLinkToken}`
                : null,
            }
          : null,
      };
    });

    return { data: items, total, page: query.page, limit: query.limit };
  }

  async getActionItems(
    clientId: string,
    query?: { type?: string; page?: number; limit?: number },
  ) {
    const items: any[] = [];
    const now = new Date();
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const typeFilter = query?.type;

    const snoozedItems = await this.prisma.clientSnoozedItem.findMany({
      where: { clientId, snoozedUntil: { gt: now } },
      select: { itemType: true, itemId: true },
    });
    const snoozedKeys = new Set(
      snoozedItems.map((s) => `${s.itemType}-${s.itemId}`),
    );

    const fetchDeliverables =
      !typeFilter || typeFilter === "DELIVERABLE_APPROVAL";
    const fetchInvoices = !typeFilter || typeFilter === "INVOICE_PAYMENT";
    const fetchProposals = !typeFilter || typeFilter === "PROPOSAL_REVIEW";
    const fetchContracts = !typeFilter || typeFilter === "CONTRACT_SIGN";
    const fetchStrategyReviews =
      !typeFilter || typeFilter === "STRATEGY_REVIEW";

    if (fetchDeliverables) {
      const projects = await this.prisma.project.findMany({
        where: { clientId, isArchived: false },
        select: { id: true },
      });
      const projectIds = projects.map((p) => p.id);

      const reviewDeliverables = await this.prisma.deliverable.findMany({
        where: {
          projectId: { in: projectIds },
          status: TaskStatus.IN_REVIEW,
          isVisibleToClient: true,
        },
        include: { project: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });

      for (const d of reviewDeliverables) {
        if (snoozedKeys.has(`DELIVERABLE_APPROVAL-${d.id}`)) continue;
        items.push({
          id: `del-${d.id}`,
          type: "DELIVERABLE_APPROVAL",
          title: d.title,
          subtitle: `مشروع: ${d.project.name}`,
          actionUrl: `/portal/deliverables/${d.id}`,
          priority: "high",
          createdAt: d.createdAt,
        });
      }
    }

    if (fetchInvoices) {
      const unpaidInvoices = await this.prisma.invoice.findMany({
        where: {
          clientId,
          status: {
            in: [
              InvoiceStatus.DUE,
              InvoiceStatus.SENT,
              InvoiceStatus.PARTIAL,
              InvoiceStatus.LATE,
            ],
          },
        },
        orderBy: { dueDate: "asc" },
      });

      for (const inv of unpaidInvoices) {
        if (snoozedKeys.has(`INVOICE_PAYMENT-${inv.id}`)) continue;
        const daysUntilDue = inv.dueDate
          ? Math.ceil(
              (new Date(inv.dueDate).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 999;
        let priority: string = "low";
        if (daysUntilDue <= 3 || inv.status === InvoiceStatus.LATE)
          priority = "high";
        else if (daysUntilDue <= 7) priority = "normal";

        items.push({
          id: `inv-${inv.id}`,
          type: "INVOICE_PAYMENT",
          title: `فاتورة ${inv.invoiceNumber}`,
          subtitle: `المبلغ: ${inv.amount.toLocaleString("ar-SA-u-nu-latn")} ر.س${daysUntilDue <= 3 ? " — مستحقة قريباً" : ""}`,
          actionUrl: `/portal/invoices/${inv.id}`,
          dueDate: inv.dueDate,
          priority,
          createdAt: inv.createdAt,
        });
      }
    }

    if (fetchContracts) {
      const sentContracts = await this.prisma.contract.findMany({
        where: { clientId, status: ContractStatus.SENT },
        orderBy: { createdAt: "desc" },
      });
      for (const c of sentContracts) {
        if (snoozedKeys.has(`CONTRACT_SIGN-${c.id}`)) continue;
        items.push({
          id: `con-${c.id}`,
          type: "CONTRACT_SIGN",
          title: c.title,
          subtitle: "عقد بانتظار توقيعك",
          actionUrl: c.shareLinkToken
            ? `/portal/contracts/${c.shareLinkToken}`
            : "/portal/contracts",
          priority: "high",
          createdAt: c.createdAt,
        });
      }
    }

    if (fetchProposals) {
      const pendingProposals = await this.prisma.proposal.findMany({
        where: {
          status: ProposalStatus.SENT,
          OR: [{ clientId }, { request: { clientId } }],
        },
        orderBy: { sentAt: "desc" },
      });
      for (const p of pendingProposals) {
        if (snoozedKeys.has(`PROPOSAL_REVIEW-${p.id}`)) continue;
        items.push({
          id: `prop-${p.id}`,
          type: "PROPOSAL_REVIEW",
          title: p.title,
          subtitle: "عرض فني بانتظار مراجعتك",
          actionUrl: p.shareLinkToken
            ? `/portal/proposals/${p.shareLinkToken}`
            : "/portal/proposals",
          priority: "normal",
          createdAt: p.sentAt ?? p.createdAt,
        });
      }
    }

    if (fetchStrategyReviews) {
      const pendingStrategies = await this.prisma.marketingStrategy.findMany({
        where: {
          clientId,
          status: "SENT",
        },
        include: {
          task: {
            select: {
              title: true,
              project: { select: { name: true } },
            },
          },
        },
        orderBy: { sentAt: "desc" },
      });

      for (const s of pendingStrategies) {
        if (snoozedKeys.has(`STRATEGY_REVIEW-${s.id}`)) continue;
        items.push({
          id: `strat-${s.id}`,
          type: "STRATEGY_REVIEW",
          title: `دراسة تسويقية — ${s.task?.project?.name ?? ""}`,
          subtitle: `دراسة تسويقية للمهمة "${s.task?.title ?? ""}" بانتظار مراجعتك`,
          actionUrl: `/portal/marketing-strategies/${s.id}`,
          priority: "high",
          createdAt: s.sentAt ?? s.createdAt,
        });
      }
    }

    items.sort((a, b) => {
      const prio = { high: 0, normal: 1, low: 2 };
      return (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2);
    });

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return { items: paginatedItems, total, page, limit };
  }

  /**
   * Resolve a `deliverableId` (the value embedded in `actionUrl` for
   * DELIVERABLE_APPROVAL items) back to its owning project, so the client
   * portal can deep-link into the right review surface.
   *
   * Why this exists:
   *   `getActionItems` emits `actionUrl: /portal/deliverables/${deliverableId}`,
   *   but the actual client review UX is project-scoped (one modal per
   *   project). Without this resolver the deep-link 404s. The redirect is
   *   served from the controller, this just enforces ownership.
   */
  async resolveDeliverableForReview(clientId: string, deliverableId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      select: {
        id: true,
        projectId: true,
        project: { select: { clientId: true } },
      },
    });
    if (!deliverable || deliverable.project.clientId !== clientId) {
      throw new NotFoundException("Deliverable not found");
    }
    return { projectId: deliverable.projectId };
  }

  /**
   * List the client's currently-snoozed action items, joined with the
   * original action-item shape so the UI can render the same row UI it
   * uses on `/portal/actions`.
   *
   * Two filter modes:
   *   - `activeOnly=true` (default) — only items whose snooze is still
   *     in the future. Matches what the client perceives as "snoozed".
   *   - `activeOnly=false` — also include items whose snooze already
   *     expired (i.e. the reminder was already sent). Useful for "history"
   *     views and debugging.
   */
  async getSnoozedItems(clientId: string, activeOnly: boolean = true) {
    const now = new Date();
    const where: any = { clientId };
    if (activeOnly) {
      where.snoozedUntil = { gt: now };
    } else {
      where.snoozedUntil = { lte: now };
    }

    const snoozed = await this.prisma.clientSnoozedItem.findMany({
      where,
      orderBy: { snoozedUntil: "asc" },
    });

    if (snoozed.length === 0) return [];

    // Resolve each snoozed item back into the action-item shape so the UI
    // can reuse the same row rendering pipeline (ActionItemCard + Pill +
    // ActionButton). We do this in O(n) by batching the lookups per type.
    const byType = new Map<string, Set<string>>();
    for (const s of snoozed) {
      if (!byType.has(s.itemType)) byType.set(s.itemType, new Set());
      byType.get(s.itemType)!.add(s.itemId);
    }

    const enriched: any[] = [];
    for (const s of snoozed) {
      enriched.push({
        ...(await this.resolveActionItemShape(clientId, s.itemType, s.itemId)),
        snoozedUntil: s.snoozedUntil,
        reminderSentAt: s.reminderSentAt,
        isActive: s.snoozedUntil > now,
      });
    }
    return enriched;
  }

  /**
   * Build the same `{ id, type, title, subtitle, actionUrl, priority,
   * createdAt }` shape that `getActionItems` emits, but for a SINGLE
   * `(itemType, itemId)` pair. Returns `null` if the underlying entity
   * is gone (e.g. deliverable was approved and deleted). The controller
   * surfaces `null` as an empty list rather than 404 — it's expected
   * that the underlying state moved on.
   */
  private async resolveActionItemShape(
    clientId: string,
    itemType: string,
    itemId: string,
  ): Promise<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    actionUrl: string;
    priority: string;
    createdAt: Date | null;
  } | null> {
    const now = new Date();

    switch (itemType) {
      case "DELIVERABLE_APPROVAL": {
        const d = await this.prisma.deliverable.findFirst({
          where: { id: itemId, isVisibleToClient: true },
          include: { project: { select: { clientId: true, name: true } } },
        });
        if (!d || d.project.clientId !== clientId) return null;
        return {
          id: `del-${d.id}`,
          type: "DELIVERABLE_APPROVAL",
          title: d.title,
          subtitle: `مشروع: ${d.project.name}`,
          actionUrl: `/portal/deliverables/${d.id}`,
          priority: d.status === "IN_REVIEW" ? "high" : "normal",
          createdAt: d.createdAt,
        };
      }
      case "INVOICE_PAYMENT": {
        const inv = await this.prisma.invoice.findFirst({
          where: { id: itemId, clientId },
        });
        if (!inv) return null;
        const daysUntilDue = inv.dueDate
          ? Math.ceil(
              (new Date(inv.dueDate).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 999;
        let priority: string = "low";
        if (daysUntilDue <= 3 || inv.status === "LATE") priority = "high";
        else if (daysUntilDue <= 7) priority = "normal";
        return {
          id: `inv-${inv.id}`,
          type: "INVOICE_PAYMENT",
          title: `فاتورة ${inv.invoiceNumber}`,
          subtitle: `المبلغ: ${inv.amount.toLocaleString("ar-SA-u-nu-latn")} ر.س${daysUntilDue <= 3 ? " — مستحقة قريباً" : ""}`,
          actionUrl: `/portal/invoices/${inv.id}`,
          priority,
          createdAt: inv.createdAt,
        };
      }
      case "CONTRACT_SIGN": {
        const c = await this.prisma.contract.findFirst({
          where: { id: itemId, clientId },
        });
        if (!c) return null;
        return {
          id: `con-${c.id}`,
          type: "CONTRACT_SIGN",
          title: c.title,
          subtitle: "عقد بانتظار توقيعك",
          actionUrl: c.shareLinkToken
            ? `/portal/contracts/${c.shareLinkToken}`
            : "/portal/contracts",
          priority: "high",
          createdAt: c.createdAt,
        };
      }
      case "PROPOSAL_REVIEW": {
        const p = await this.prisma.proposal.findFirst({
          where: {
            id: itemId,
            OR: [{ clientId }, { request: { clientId } }],
          },
        });
        if (!p) return null;
        return {
          id: `prop-${p.id}`,
          type: "PROPOSAL_REVIEW",
          title: p.title,
          subtitle: "عرض فني بانتظار مراجعتك",
          actionUrl: p.shareLinkToken
            ? `/portal/proposals/${p.shareLinkToken}`
            : "/portal/proposals",
          priority: "normal",
          createdAt: p.sentAt ?? p.createdAt,
        };
      }
      case "STRATEGY_REVIEW": {
        const s = await this.prisma.marketingStrategy.findFirst({
          where: { id: itemId, clientId },
          include: {
            task: {
              select: {
                title: true,
                project: { select: { name: true } },
              },
            },
          },
        });
        if (!s) return null;
        return {
          id: `strat-${s.id}`,
          type: "STRATEGY_REVIEW",
          title: `دراسة تسويقية — ${s.task?.project?.name ?? ""}`,
          subtitle: `دراسة تسويقية للمهمة "${s.task?.title ?? ""}" بانتظار مراجعتك`,
          actionUrl: `/portal/marketing-strategies/${s.id}`,
          priority: "high",
          createdAt: s.sentAt ?? s.createdAt,
        };
      }
      default:
        return null;
    }
  }

  async snoozeActionItem(
    clientId: string,
    itemType: string,
    itemId: string,
    hours: number = 24,
  ) {
    const snoozedUntil = new Date();
    snoozedUntil.setHours(snoozedUntil.getHours() + hours);

    const result = await this.prisma.clientSnoozedItem.upsert({
      where: {
        clientId_itemType_itemId: { clientId, itemType, itemId },
      },
      update: { snoozedUntil, reminderSentAt: null },
      create: { clientId, itemType, itemId, snoozedUntil },
    });

    // Write a history log so the PM / admin side can see the snooze.
    // Wrapped in a try/catch + silent fallback: a history-log failure
    // must never roll back the snooze write — the snooze is the
    // user-visible state, the history is a derived audit trail.
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true, companyName: true },
      });
      if (client?.userId) {
        await this.prisma.clientHistoryLog.create({
          data: {
            clientId,
            userId: client.userId,
            eventType: "ACTION_ITEM_SNOOZED",
            description: `العميل أخفى إجراءً من النوع ${itemType} لمدة ${hours} ساعة (${this.itemTypeAr(itemType)}).`,
            metadata: {
              itemType,
              itemId,
              hours,
              snoozedUntil: snoozedUntil.toISOString(),
            },
          },
        });
      }
    } catch {
      // Silent — audit-log failure is non-critical.
    }

    return result;
  }

  /**
   * Map the internal `itemType` enum to its Arabic display label so the
   * `ClientHistoryLog.description` is human-readable on the PM/admin side.
   */
  private itemTypeAr(itemType: string): string {
    switch (itemType) {
      case "DELIVERABLE_APPROVAL":
        return "مراجعة تسليم";
      case "INVOICE_PAYMENT":
        return "دفع فاتورة";
      case "PROPOSAL_REVIEW":
        return "مراجعة عرض";
      case "CONTRACT_SIGN":
        return "توقيع عقد";
      case "STRATEGY_REVIEW":
        return "مراجعة دراسة تسويقية";
      default:
        return itemType;
    }
  }

  async unsnoozeActionItem(clientId: string, itemType: string, itemId: string) {
    try {
      await this.prisma.clientSnoozedItem.delete({
        where: {
          clientId_itemType_itemId: { clientId, itemType, itemId },
        },
      });
    } catch {
      // Already removed — no-op
    }
    return { success: true };
  }

  async getActivityFeed(clientId: string) {
    const items: any[] = [];

    const projects = await this.prisma.project.findMany({
      where: { clientId, isArchived: false },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDeliverables = await this.prisma.deliverable.findMany({
      where: {
        projectId: { in: projectIds },
        isVisibleToClient: true,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        approvedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const d of recentDeliverables) {
      if (d.approvedAt) {
        items.push({
          id: `del-approve-${d.id}`,
          date: d.approvedAt,
          text: `تم اعتماد "${d.title}"`,
          icon: "check",
        });
      }
      if (d.status === TaskStatus.REVISION) {
        items.push({
          id: `del-revision-${d.id}`,
          date: d.createdAt,
          text: `طلب تعديل على "${d.title}"`,
          icon: "palette",
        });
      }
      items.push({
        id: `del-upload-${d.id}`,
        date: d.createdAt,
        text: `تم رفع "${d.title}"`,
        icon: "file",
      });
    }

    const recentCampaigns = await this.prisma.campaign.findMany({
      where: { clientId, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const c of recentCampaigns) {
      items.push({
        id: `camp-${c.id}`,
        date: c.createdAt,
        text: `تم إطلاق حملة "${c.name}"`,
        icon: "trending",
      });
    }

    const recentPayments = await this.prisma.payment.findMany({
      where: { clientId, status: "SUCCESS", date: { gte: thirtyDaysAgo } },
      select: { id: true, amount: true, date: true },
      orderBy: { date: "desc" },
      take: 5,
    });

    for (const p of recentPayments) {
      items.push({
        id: `pay-${p.id}`,
        date: p.date,
        text: `تم دفع ${p.amount.toLocaleString("ar-SA-u-nu-latn")} ر.س`,
        icon: "dollar",
      });
    }

    const historyLogs = await this.prisma.clientHistoryLog.findMany({
      where: { clientId, occurredAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        eventType: true,
        description: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "desc" },
      take: 10,
    });

    for (const h of historyLogs) {
      items.push({
        id: `hist-${h.id}`,
        date: h.occurredAt,
        text: h.description,
        icon: "file",
      });
    }

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const unique = items.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id),
    );

    return { items: unique.slice(0, 15) };
  }

  async getCampaignSummary(clientId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId, isArchived: false },
      select: { id: true, status: true },
    });

    if (campaigns.length === 0) {
      return {
        totalVisits: 0,
        totalConversions: 0,
        avgRoas: 0,
        improvementPercent: 0,
      };
    }

    const campaignIds = campaigns.map((c) => c.id);

    const latestSnapshots = await this.prisma.campaignKpiSnapshot.findMany({
      where: { campaignId: { in: campaignIds } },
      orderBy: { recordedAt: "desc" },
      distinct: ["campaignId"],
    });

    let totalVisits = 0;
    let totalConversions = 0;
    let totalRoas = 0;
    let roasCount = 0;

    for (const s of latestSnapshots) {
      totalVisits += s.impressions;
      totalConversions += s.conversions;
      if (s.roas > 0) {
        totalRoas += s.roas;
        roasCount++;
      }
    }

    const avgRoas =
      roasCount > 0 ? Math.round((totalRoas / roasCount) * 10) / 10 : 0;

    let improvementPercent = 0;
    if (latestSnapshots.length > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const olderSnapshots = await this.prisma.campaignKpiSnapshot.findMany({
        where: {
          campaignId: { in: campaignIds },
          recordedAt: { lt: sevenDaysAgo },
        },
        orderBy: { recordedAt: "desc" },
        distinct: ["campaignId"],
      });

      if (olderSnapshots.length > 0) {
        const olderTotalConversions = olderSnapshots.reduce(
          (s, snap) => s + snap.conversions,
          0,
        );
        if (olderTotalConversions > 0) {
          improvementPercent = Math.round(
            ((totalConversions - olderTotalConversions) /
              olderTotalConversions) *
              100,
          );
        }
      }
    }

    return {
      totalVisits,
      totalConversions,
      avgRoas,
      improvementPercent,
    };
  }

  async getContractById(params: {
    contractId: string;
    clientId: string | null;
    role: string;
  }): Promise<PortalContractDetail> {
    const { contractId, clientId, role } = params;

    const where: any = {
      OR: [{ id: contractId }, { shareLinkToken: contractId }],
    };
    if (role === "CLIENT" && clientId) {
      where.clientId = clientId;
    }

    const contract = await this.prisma.contract.findFirst({
      where,
      include: {
        client: {
          select: { id: true, companyName: true },
        },
        proposal: true,
        invoices: {
          include: { items: true, payments: true },
        },
        request: {
          select: { id: true, status: true },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException("العقد غير موجود");
    }

    return contract;
  }

  async getContracts(
    clientId: string,
    query: {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      page: number;
      limit: number;
    },
  ) {
    const where: any = { clientId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.title = { contains: query.search, mode: "insensitive" };
    }
    if (query.dateFrom || query.dateTo) {
      where.startDate = {};
      if (query.dateFrom) where.startDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.startDate.lte = new Date(query.dateTo);
    }

    const sortField = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: {
          proposal: { select: { id: true, title: true } },
          projects: {
            select: {
              manager: { select: { name: true } },
            },
            take: 1,
          },
        },
        orderBy: { [sortField]: sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.contract.count({ where }),
    ]);

    const items = data.map((c) => ({
      ...c,
      projectManager: c.projects[0]?.manager?.name ?? null,
    }));

    return { data: items, total, page: query.page, limit: query.limit };
  }

  async getFinanceSummary(clientId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { clientId },
      include: { payments: { select: { amount: true, status: true } } },
      orderBy: { dueDate: "asc" },
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let nextInvoiceDueDate: Date | null = null;
    let nextInvoiceAmount = 0;

    for (const inv of invoices) {
      totalInvoiced += inv.amount;
      const paid = inv.payments
        .filter((p) => p.status === "SUCCESS")
        .reduce((sum, p) => sum + p.amount, 0);
      totalPaid += paid;

      if (
        !nextInvoiceDueDate &&
        inv.dueDate &&
        inv.status !== "PAID" &&
        inv.status !== "CANCELLED"
      ) {
        nextInvoiceDueDate = inv.dueDate;
        nextInvoiceAmount = Math.max(0, inv.amount - paid);
      }
    }

    const totalRemaining = Math.max(0, totalInvoiced - totalPaid);

    return {
      totalInvoiced,
      totalPaid,
      totalRemaining,
      nextInvoiceDueDate: nextInvoiceDueDate?.toISOString() ?? null,
      nextInvoiceAmount,
    };
  }

  async getInvoices(
    clientId: string,
    query: { status?: string; page: number; limit: number },
  ) {
    const where: any = { clientId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          contract: { select: { id: true, title: true } },
          payments: { select: { amount: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const items = data.map((inv) => {
      const paidAmount = inv.payments
        .filter((p) => p.status === "SUCCESS")
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        ...inv,
        paidAmount,
        remainingAmount: Math.max(0, inv.amount - paidAmount),
      };
    });

    return { data: items, total, page: query.page, limit: query.limit };
  }

  async createDeliverable(
    userId: string,
    dto: CreateDeliverableDto,
    filePath: string,
  ) {
    return this.prisma.deliverable.create({
      data: {
        projectId: dto.projectId,
        taskId: dto.taskId,
        title: dto.title,
        description: dto.description,
        filePath,
        status: TaskStatus.TODO,
      },
    });
  }

  async findDeliverable(id: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id },
      include: {
        project: true,
        task: true,
        revisionRequests: true,
      },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${id} not found`);
    }

    if (deliverable.filePath) {
      const url = await this.storageService.getPresignedUrl(
        deliverable.filePath,
      );
      (deliverable as any).url = url;
    }

    return deliverable;
  }

  async approveDeliverable(id: string, userId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id },
      include: { project: { select: { clientId: true, name: true } } },
    });

    const updated = await this.prisma.deliverable.update({
      where: { id },
      data: {
        status: TaskStatus.DONE,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    if (deliverable?.project?.clientId) {
      const clientUser = await this.prisma.client.findUnique({
        where: { id: deliverable.project.clientId },
        select: { userId: true },
      });
      if (clientUser?.userId) {
        this.notificationsService
          .createNotification({
            entityId: id,
            entityType: "deliverable",
            eventType: "DELIVERABLE_APPROVED",
            userId: clientUser.userId,
            title: "تم اعتماد التسليمة",
            body: `تم اعتماد التسليمة "${deliverable.title}" في مشروع ${deliverable.project.name}`,
          })
          .catch(() => undefined);
      }
    }

    return updated;
  }

  async rejectDeliverable(id: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id },
      include: { project: { select: { clientId: true, name: true } } },
    });

    const updated = await this.prisma.deliverable.update({
      where: { id },
      data: { status: TaskStatus.REVISION },
    });

    if (deliverable?.project?.clientId) {
      const clientUser = await this.prisma.client.findUnique({
        where: { id: deliverable.project.clientId },
        select: { userId: true },
      });
      if (clientUser?.userId) {
        this.notificationsService
          .createNotification({
            entityId: id,
            entityType: "deliverable",
            eventType: "DELIVERABLE_REVISION",
            userId: clientUser.userId,
            title: "تم طلب تعديل على التسليمة",
            body: `تم طلب تعديلات على التسليمة "${deliverable.title}" في مشروع ${deliverable.project.name}`,
          })
          .catch(() => undefined);
      }
    }

    return updated;
  }

  async createRevision(id: string, clientId: string, dto: CreateRevisionDto) {
    return this.prisma.clientRevisionRequest.create({
      data: {
        deliverableId: id,
        clientId,
        requestDescription: dto.requestDescription,
        status: TaskStatus.TODO,
      },
    });
  }

  async getRevisions(id: string) {
    return this.prisma.clientRevisionRequest.findMany({
      where: { deliverableId: id },
    });
  }

  async findDeliverablesByProject(projectId: string) {
    const deliverables = await this.prisma.deliverable.findMany({
      where: { projectId },
      include: { revisionRequests: true },
      orderBy: { createdAt: "desc" },
    });

    const fileKeys = deliverables
      .filter((d) => d.filePath)
      .map((d) => d.filePath);

    if (fileKeys.length > 0) {
      const urlMap =
        await this.storageService.getMultiplePresignedUrls(fileKeys);
      for (const d of deliverables) {
        if (d.filePath) {
          (d as any).url = urlMap.get(d.filePath) || null;
        }
      }
    }

    return deliverables;
  }

  async findDeliverablesByClient(clientId: string) {
    const projects = await this.prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
    const deliverables = await this.prisma.deliverable.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true } },
        revisionRequests: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const fileKeys = deliverables
      .filter((d) => d.filePath)
      .map((d) => d.filePath);

    if (fileKeys.length > 0) {
      const urlMap =
        await this.storageService.getMultiplePresignedUrls(fileKeys);
      for (const d of deliverables) {
        if (d.filePath) {
          (d as any).url = urlMap.get(d.filePath) || null;
        }
      }
    }

    return deliverables;
  }

  async createIntakeForm(
    clientId: string,
    dto: CreateIntakeFormDto,
    uploadedFiles: {
      key: string;
      originalName: string;
      mimeType: string;
    }[] = [],
  ) {
    const token = randomBytes(32).toString("hex");

    return this.prisma.$transaction(async (tx) => {
      const intakeForm = await tx.portalIntakeForm.upsert({
        where: { clientId },
        update: {
          industry: dto.industry,
          businessDescription: dto.businessDescription,
          targetAudience: dto.targetAudience,
          budgetRangeMin: dto.budgetRangeMin,
          budgetRangeMax: dto.budgetRangeMax,
          campaignGoals: dto.campaignGoals,
          campaignOffer: dto.campaignOffer,
          competitors: dto.competitors,
          seasonalTiming: dto.seasonalTiming,
          orderMethods: dto.orderMethods,
          abandonedCartSystem: dto.abandonedCartSystem,
          hasVisualIdentity: dto.hasVisualIdentity,
          brandAssets: dto.brandAssets,
          visualReferences: dto.visualReferences,
          uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          // V2 sections (carry over on final submit)
          currentStep: dto.currentStep ?? undefined,
          communicationInfo: dto.communicationInfo ?? undefined,
          productInfo: dto.productInfo ?? undefined,
          audienceInfo: dto.audienceInfo ?? undefined,
          brandVoice: dto.brandVoice ?? undefined,
          customerJourney: dto.customerJourney ?? undefined,
          campaignInfo: dto.campaignInfo ?? undefined,
          pastPerformance: dto.pastPerformance ?? undefined,
          budgetInfo: dto.budgetInfo ?? undefined,
          visualIdentityInfo: dto.visualIdentityInfo ?? undefined,
          isSubmitted: true,
          submittedAt: new Date(),
        },
        create: {
          clientId,
          token,
          industry: dto.industry,
          businessDescription: dto.businessDescription,
          targetAudience: dto.targetAudience,
          budgetRangeMin: dto.budgetRangeMin,
          budgetRangeMax: dto.budgetRangeMax,
          campaignGoals: dto.campaignGoals,
          campaignOffer: dto.campaignOffer,
          competitors: dto.competitors,
          seasonalTiming: dto.seasonalTiming,
          orderMethods: dto.orderMethods,
          abandonedCartSystem: dto.abandonedCartSystem,
          hasVisualIdentity: dto.hasVisualIdentity,
          brandAssets: dto.brandAssets,
          visualReferences: dto.visualReferences,
          uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          currentStep: dto.currentStep ?? undefined,
          communicationInfo: dto.communicationInfo ?? undefined,
          productInfo: dto.productInfo ?? undefined,
          audienceInfo: dto.audienceInfo ?? undefined,
          brandVoice: dto.brandVoice ?? undefined,
          customerJourney: dto.customerJourney ?? undefined,
          campaignInfo: dto.campaignInfo ?? undefined,
          pastPerformance: dto.pastPerformance ?? undefined,
          budgetInfo: dto.budgetInfo ?? undefined,
          visualIdentityInfo: dto.visualIdentityInfo ?? undefined,
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });

      // Sync all V2 fields to ClientProfile (single source of truth)
      await tx.clientProfile.upsert({
        where: { clientId },
        update: {
          // Legacy fields (kept for backward compatibility)
          industry: dto.industry,
          businessDescription: dto.businessDescription,
          targetAudience: dto.targetAudience,
          budgetRangeMin: dto.budgetRangeMin,
          budgetRangeMax: dto.budgetRangeMax,
          brandAssets: dto.brandAssets,
          // V2 fields (unified with IntakeFormV2)
          communicationInfo: dto.communicationInfo ?? undefined,
          productInfo: dto.productInfo ?? undefined,
          audienceInfo: dto.audienceInfo ?? undefined,
          brandVoice: dto.brandVoice ?? undefined,
          customerJourney: dto.customerJourney ?? undefined,
          campaignInfo: dto.campaignInfo ?? undefined,
          pastPerformance: dto.pastPerformance ?? undefined,
          budgetInfo: dto.budgetInfo ?? undefined,
          visualIdentityInfo: dto.visualIdentityInfo ?? undefined,
        },
        create: {
          clientId,
          // Legacy fields
          industry: dto.industry,
          businessDescription: dto.businessDescription,
          targetAudience: dto.targetAudience,
          budgetRangeMin: dto.budgetRangeMin,
          budgetRangeMax: dto.budgetRangeMax,
          brandAssets: dto.brandAssets,
          // V2 fields
          communicationInfo: dto.communicationInfo ?? undefined,
          productInfo: dto.productInfo ?? undefined,
          audienceInfo: dto.audienceInfo ?? undefined,
          brandVoice: dto.brandVoice ?? undefined,
          customerJourney: dto.customerJourney ?? undefined,
          campaignInfo: dto.campaignInfo ?? undefined,
          pastPerformance: dto.pastPerformance ?? undefined,
          budgetInfo: dto.budgetInfo ?? undefined,
          visualIdentityInfo: dto.visualIdentityInfo ?? undefined,
        },
      });

      await tx.client.update({
        where: { id: clientId },
        data: { intakeCompleted: true },
      });

      return intakeForm;
    });
  }

  async getIntakeForm(clientId: string) {
    const form = await this.prisma.portalIntakeForm.findUnique({
      where: { clientId },
    });

    if (!form) return null;

    const files = form.uploadedFiles as
      | { key: string; originalName: string; mimeType: string }[]
      | null;

    if (files && files.length > 0) {
      const allFileKeys = files.map((f) => f.key);
      const urlMap =
        await this.storageService.getMultiplePresignedUrls(allFileKeys);

      (form as any).uploadedFiles = files.map((f) => ({
        ...f,
        url: urlMap.get(f.key) || null,
      }));
    }

    return form;
  }

  async saveDraft(clientId: string, dto: SaveDraftDto) {
    const token = randomBytes(32).toString("hex");

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.portalIntakeForm.findUnique({
        where: { clientId },
        select: { id: true, token: true },
      });

      return tx.portalIntakeForm.upsert({
        where: { clientId },
        update: {
          currentStep: dto.currentStep ?? undefined,
          communicationInfo: dto.communicationInfo ?? undefined,
          productInfo: dto.productInfo ?? undefined,
          audienceInfo: dto.audienceInfo ?? undefined,
          brandVoice: dto.brandVoice ?? undefined,
          customerJourney: dto.customerJourney ?? undefined,
          campaignInfo: dto.campaignInfo ?? undefined,
          pastPerformance: dto.pastPerformance ?? undefined,
          budgetInfo: dto.budgetInfo ?? undefined,
          visualIdentityInfo: dto.visualIdentityInfo ?? undefined,
        },
        create: {
          clientId,
          token: token,
          currentStep: dto.currentStep ?? 1,
          communicationInfo: dto.communicationInfo ?? undefined,
          productInfo: dto.productInfo ?? undefined,
          audienceInfo: dto.audienceInfo ?? undefined,
          brandVoice: dto.brandVoice ?? undefined,
          customerJourney: dto.customerJourney ?? undefined,
          campaignInfo: dto.campaignInfo ?? undefined,
          pastPerformance: dto.pastPerformance ?? undefined,
          budgetInfo: dto.budgetInfo ?? undefined,
          visualIdentityInfo: dto.visualIdentityInfo ?? undefined,
        },
      });
    });
  }

  /**
   * List a client's non-archived campaigns.
   * Optional `projectId` filter narrows the result to campaigns attached to
   * a specific project. (Audit issue #8)
   */
  /**
   * List a client's non-archived campaigns.
   *
   * Optional filters:
   *   - `projectId`: narrow to campaigns attached to one project.
   *   - `periodId`:  narrow to campaigns attached to one period. Campaigns
   *                  with no period (project-wide campaigns) are also
   *                  returned — they're meant to surface everywhere.
   */
  async findCampaignsByClient(
    clientId: string,
    opts: { projectId?: string; periodId?: string } = {},
  ) {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        clientId,
        isArchived: false,
        ...(opts.projectId ? { projectId: opts.projectId } : {}),
        ...(opts.periodId
          ? {
              // Match period-scoped campaigns OR project-wide (periodId IS NULL)
              OR: [{ periodId: opts.periodId }, { periodId: null }],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const snapshots = await this.getLatestSnapshots(campaigns.map((c) => c.id));
    return campaigns.map((c) => ({
      ...c,
      analytics: snapshots[c.id] ?? this.emptyAnalytics(),
    }));
  }

  async findCampaignOne(id: string, clientId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, clientId, isArchived: false },
      include: {
        kpiSnapshots: {
          orderBy: { recordedAt: "desc" },
          select: {
            id: true,
            impressions: true,
            clicks: true,
            conversions: true,
            revenue: true,
            cpc: true,
            cpa: true,
            ctr: true,
            conversionRate: true,
            roas: true,
            source: true,
            recordedAt: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
    }

    const analytics = this.kpiSnapshotsToAnalytics(campaign.kpiSnapshots);
    return { ...campaign, analytics, kpiSnapshots: campaign.kpiSnapshots };
  }

  private kpiSnapshotsToAnalytics(snapshots: any[]) {
    if (snapshots.length === 0) return this.emptyAnalytics();
    const latest = snapshots[0];
    return {
      impressions: latest.impressions,
      clicks: latest.clicks,
      conversions: latest.conversions,
      revenue: latest.revenue,
      cpc: latest.cpc,
      cpa: latest.cpa,
      ctr: latest.ctr,
      conversionRate: latest.conversionRate,
      roas: latest.roas,
    };
  }

  private async getLatestSnapshots(
    campaignIds: string[],
  ): Promise<Record<string, any>> {
    if (campaignIds.length === 0) return {};

    const snapshots = await this.prisma.campaignKpiSnapshot.findMany({
      where: { campaignId: { in: campaignIds } },
      orderBy: { recordedAt: "desc" },
      distinct: ["campaignId"],
    });

    const map: Record<string, any> = {};
    for (const s of snapshots) {
      map[s.campaignId] = {
        impressions: s.impressions,
        clicks: s.clicks,
        conversions: s.conversions,
        revenue: s.revenue,
        cpc: s.cpc,
        cpa: s.cpa,
        ctr: s.ctr,
        conversionRate: s.conversionRate,
        roas: s.roas,
      };
    }
    return map;
  }

  private async getLatestAnalytics(campaignId: string): Promise<any> {
    const snapshots = await this.getLatestSnapshots([campaignId]);
    return snapshots[campaignId] ?? this.emptyAnalytics();
  }

  private emptyAnalytics() {
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      cpc: 0,
      cpa: 0,
      ctr: 0,
      conversionRate: 0,
      roas: 0,
    };
  }

  async getReportSummary(clientId: string): Promise<any> {
    const now = new Date();
    const dateFrom = new Date(now);
    dateFrom.setDate(dateFrom.getDate() - 30);

    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId },
      select: { id: true },
    });

    if (campaigns.length === 0) {
      return {
        kpiCards: [],
        smartTips: [],
        topCampaigns: [],
        platformDistribution: [],
        period: { dateFrom: dateFrom.toISOString(), dateTo: now.toISOString() },
      };
    }

    const aggregates = await this.getReportKpiAggregates(
      clientId,
      dateFrom,
      now,
    );

    const kpiCards = [
      {
        metric: "conversionRate",
        label: "معدل التحويل",
        value: aggregates.current.conversionRate,
        previousValue: aggregates.previous?.conversionRate ?? 0,
        trendPercent: aggregates.trends.conversionRate,
      },
      {
        metric: "clicks",
        label: "عدد النقرات",
        value: aggregates.current.clicks,
        previousValue: aggregates.previous?.clicks ?? 0,
        trendPercent: aggregates.trends.clicks,
      },
      {
        metric: "impressions",
        label: "عدد مرات الظهور",
        value: aggregates.current.impressions,
        previousValue: aggregates.previous?.impressions ?? 0,
        trendPercent: aggregates.trends.impressions,
      },
      {
        metric: "spend",
        label: "إجمالي الإنفاق",
        value: aggregates.current.spend,
        previousValue: aggregates.previous?.spend ?? 0,
        trendPercent: aggregates.trends.spend,
      },
    ];

    const smartTips = this.generateSmartTips(aggregates);
    const topCampaigns = await this.getTopPerformingCampaigns(
      clientId,
      dateFrom,
      now,
    );
    const platformDistribution = await this.getPlatformDistribution(
      clientId,
      dateFrom,
      now,
    );

    return {
      kpiCards,
      smartTips,
      topCampaigns,
      platformDistribution,
      period: { dateFrom: dateFrom.toISOString(), dateTo: now.toISOString() },
    };
  }

  private generateDateRangeKeys(
    dateFrom: Date,
    dateTo: Date,
    granularity: "day" | "week" | "month",
  ): string[] {
    const keys: string[] = [];

    switch (granularity) {
      case "day": {
        const cursor = new Date(
          dateFrom.getFullYear(),
          dateFrom.getMonth(),
          dateFrom.getDate(),
        );
        const end = new Date(
          dateTo.getFullYear(),
          dateTo.getMonth(),
          dateTo.getDate(),
        );
        while (cursor <= end) {
          const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
          keys.push(key);
          cursor.setDate(cursor.getDate() + 1);
        }
        break;
      }
      case "month": {
        const cursor = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
        const end = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1);
        while (cursor <= end) {
          keys.push(
            `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
          );
          cursor.setMonth(cursor.getMonth() + 1);
        }
        break;
      }
      case "week":
      default: {
        const startOfWeek = new Date(
          dateFrom.getFullYear(),
          dateFrom.getMonth(),
          dateFrom.getDate(),
        );
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const end = new Date(
          dateTo.getFullYear(),
          dateTo.getMonth(),
          dateTo.getDate(),
        );
        const cursor = new Date(startOfWeek);
        while (cursor <= end) {
          const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
          keys.push(key);
          cursor.setDate(cursor.getDate() + 7);
        }
        break;
      }
    }
    return keys;
  }

  private formatTimelineLabel(
    key: string,
    granularity: "day" | "week" | "month",
  ): string {
    switch (granularity) {
      case "day": {
        const [y, m, d] = key.split("-");
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return new Intl.DateTimeFormat("ar-SA", {
          day: "numeric",
          month: "short",
        }).format(date);
      }
      case "month": {
        const [y, m] = key.split("-");
        const d = new Date(Number(y), Number(m) - 1, 1);
        return new Intl.DateTimeFormat("ar-SA", { month: "short" }).format(d);
      }
      case "week":
      default: {
        const [y, m, d] = key.split("-");
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return new Intl.DateTimeFormat("ar-SA", {
          day: "numeric",
          month: "short",
        }).format(date);
      }
    }
  }

  private readonly ZERO_BUCKET = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
  };

  async getReportTimeline(
    clientId: string,
    dateFrom: Date,
    dateTo: Date,
    granularity: "day" | "week" | "month",
  ): Promise<any> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId },
      select: { id: true },
    });
    if (campaigns.length === 0) {
      return { labels: [], datasets: [] };
    }

    const campaignIds = campaigns.map((c) => c.id);

    const allKeys = this.generateDateRangeKeys(dateFrom, dateTo, granularity);

    const snapshots = await this.prisma.campaignKpiSnapshot.findMany({
      where: {
        campaignId: { in: campaignIds },
        recordedAt: { gte: dateFrom, lte: dateTo },
      },
      orderBy: { recordedAt: "asc" },
    });

    const buckets: Record<
      string,
      {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
      }
    > = {};

    for (const key of allKeys) {
      buckets[key] = { ...this.ZERO_BUCKET };
    }

    for (const s of snapshots) {
      const d = new Date(s.recordedAt);
      let key: string;

      switch (granularity) {
        case "day":
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          break;
        case "month":
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "week":
        default:
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
          break;
      }

      if (buckets[key]) {
        buckets[key].impressions += s.impressions;
        buckets[key].clicks += s.clicks;
        buckets[key].conversions += s.conversions;
        buckets[key].spend += s.cpc > 0 ? s.cpc * s.clicks : s.revenue;
      }
    }

    const labels = allKeys.map((key) =>
      this.formatTimelineLabel(key, granularity),
    );

    return {
      labels,
      datasets: [
        {
          label: "عدد مرات الظهور",
          data: allKeys.map((k) => buckets[k].impressions),
          metric: "impressions",
        },
        {
          label: "عدد النقرات",
          data: allKeys.map((k) => buckets[k].clicks),
          metric: "clicks",
        },
        {
          label: "عدد التحويلات",
          data: allKeys.map((k) => buckets[k].conversions),
          metric: "conversions",
        },
        {
          label: "إجمالي الإنفاق",
          data: allKeys.map((k) => buckets[k].spend),
          metric: "spend",
        },
      ],
    };
  }

  private async getReportKpiAggregates(
    clientId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId },
      select: { id: true },
    });

    if (campaigns.length === 0) {
      const zero = {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        conversionRate: 0,
        ctr: 0,
      };
      return {
        current: zero,
        previous: null,
        trends: {
          impressions: null,
          clicks: null,
          conversions: null,
          spend: null,
          conversionRate: null,
          ctr: null,
        },
      };
    }

    const campaignIds = campaigns.map((c) => c.id);
    const durationMs = dateTo.getTime() - dateFrom.getTime();
    const prevDateTo = new Date(dateFrom);
    const prevDateFrom = new Date(dateFrom.getTime() - durationMs);

    const [currentSnapshots, previousSnapshots] = await Promise.all([
      this.prisma.campaignKpiSnapshot.findMany({
        where: {
          campaignId: { in: campaignIds },
          recordedAt: { gte: dateFrom, lte: dateTo },
        },
        orderBy: { recordedAt: "desc" },
        distinct: ["campaignId"],
      }),
      this.prisma.campaignKpiSnapshot.findMany({
        where: {
          campaignId: { in: campaignIds },
          recordedAt: { gte: prevDateFrom, lte: prevDateTo },
        },
        orderBy: { recordedAt: "desc" },
        distinct: ["campaignId"],
      }),
    ]);

    const aggregate = (snaps: any[]) => {
      let impressions = 0,
        clicks = 0,
        conversions = 0,
        spend = 0,
        totalCtr = 0,
        totalConvRate = 0,
        count = snaps.length;
      for (const s of snaps) {
        impressions += s.impressions;
        clicks += s.clicks;
        conversions += s.conversions;
        spend += s.cpc > 0 ? s.cpc * s.clicks : s.revenue;
        totalCtr += s.ctr;
        totalConvRate += s.conversionRate;
      }
      return {
        impressions,
        clicks,
        conversions,
        spend,
        conversionRate: count > 0 ? totalConvRate / count : 0,
        ctr: count > 0 ? totalCtr / count : 0,
      };
    };

    const current = aggregate(currentSnapshots);
    const previous =
      previousSnapshots.length > 0 ? aggregate(previousSnapshots) : null;

    const trend = (curr: number, prev: number | undefined) =>
      prev != null && prev > 0
        ? Math.round(((curr - prev) / prev) * 100 * 10) / 10
        : null;

    return {
      current,
      previous,
      trends: {
        impressions: trend(current.impressions, previous?.impressions),
        clicks: trend(current.clicks, previous?.clicks),
        conversions: trend(current.conversions, previous?.conversions),
        spend: trend(current.spend, previous?.spend),
        conversionRate: trend(current.conversionRate, previous?.conversionRate),
        ctr: trend(current.ctr, previous?.ctr),
      },
    };
  }

  private async getTopPerformingCampaigns(
    clientId: string,
    dateFrom: Date,
    dateTo: Date,
    sortBy: string = "conversions",
    limit: number = 10,
  ): Promise<any[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId },
      select: { id: true, name: true, platform: true },
    });

    if (campaigns.length === 0) return [];

    const campaignIds = campaigns.map((c) => c.id);

    const snapshots = await this.prisma.campaignKpiSnapshot.findMany({
      where: {
        campaignId: { in: campaignIds },
        recordedAt: { gte: dateFrom, lte: dateTo },
      },
    });

    const campaignMetrics: Record<string, any> = {};
    for (const c of campaigns) {
      campaignMetrics[c.id] = {
        id: c.id,
        name: c.name,
        platform: c.platform,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        conversionRate: 0,
      };
    }

    for (const s of snapshots) {
      const cm = campaignMetrics[s.campaignId];
      if (!cm) continue;
      cm.impressions += s.impressions;
      cm.clicks += s.clicks;
      cm.conversions += s.conversions;
      cm.spend += s.cpc > 0 ? s.cpc * s.clicks : s.revenue;
    }

    for (const id of Object.keys(campaignMetrics)) {
      const cm = campaignMetrics[id];
      cm.conversionRate =
        cm.clicks > 0
          ? Math.round((cm.conversions / cm.clicks) * 100 * 10) / 10
          : 0;
    }

    const validSortKeys = [
      "impressions",
      "clicks",
      "conversions",
      "spend",
      "conversionRate",
    ];
    const sortKey = validSortKeys.includes(sortBy) ? sortBy : "conversions";

    return Object.values(campaignMetrics)
      .sort((a: any, b: any) => (b[sortKey] > a[sortKey] ? 1 : -1))
      .slice(0, limit);
  }

  private async getPlatformDistribution(
    clientId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId },
      select: { id: true, platform: true },
    });

    if (campaigns.length === 0) return [];

    const byPlatform: Record<string, { campaignIds: string[]; spend: number }> =
      {};
    for (const c of campaigns) {
      if (!byPlatform[c.platform]) {
        byPlatform[c.platform] = { campaignIds: [], spend: 0 };
      }
      byPlatform[c.platform].campaignIds.push(c.id);
    }

    for (const platform of Object.keys(byPlatform)) {
      const ids = byPlatform[platform].campaignIds;
      if (ids.length === 0) continue;

      const snapshots = await this.prisma.campaignKpiSnapshot.findMany({
        where: {
          campaignId: { in: ids },
          recordedAt: { gte: dateFrom, lte: dateTo },
        },
      });

      let spend = 0;
      for (const s of snapshots) {
        spend += s.cpc > 0 ? s.cpc * s.clicks : s.revenue;
      }
      byPlatform[platform].spend = spend;
    }

    const totalSpend = Object.values(byPlatform).reduce(
      (sum, p) => sum + p.spend,
      0,
    );

    const platformAr: Record<string, string> = {
      GOOGLE: "جوجل",
      META: "ميتا",
      TIKTOK: "تيكتوك",
      SNAPCHAT: "سناب شات",
    };

    return Object.entries(byPlatform)
      .filter(([, p]) => p.spend > 0)
      .map(([platform, p]) => ({
        platform: platformAr[platform] || platform,
        spend: p.spend,
        percent:
          totalSpend > 0
            ? Math.round((p.spend / totalSpend) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.spend - a.spend);
  }

  private generateSmartTips(aggregates: any): any[] {
    const tips: any[] = [];
    const { current, trends } = aggregates;

    if (current.conversionRate > 5) {
      tips.push({
        type: "budget",
        title: "الميزانية",
        description: "زيادة الميزانية على ميتا بنسبة 20%",
      });
    }

    if (trends.conversionRate != null && trends.conversionRate < 0) {
      tips.push({
        type: "warning",
        title: "تنبيه",
        description: "تقليل الإنفاق على تيكتوك",
      });
    }

    if (current.clicks < 100) {
      tips.push({
        type: "insight",
        title: "نصيحة",
        description: "الاستثمار أكثر في محتوى الفيديو",
      });
    }

    if (current.ctr < 1) {
      tips.push({
        type: "insight",
        title: "تحذير",
        description: "الاستثمار أكثر في محتوى الفيديو",
      });
    }

    const priorityOrder: Record<string, number> = {
      warning: 0,
      budget: 1,
      insight: 2,
    };

    return tips
      .sort(
        (a, b) => (priorityOrder[a.type] ?? 3) - (priorityOrder[b.type] ?? 3),
      )
      .slice(0, 4);
  }

  // ── Project Review (Client Approval Flow) ──────────────────────────────────

  async getReviewProjects(clientId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        clientId,
        status: ProjectStatus.AWAITING_REVIEW,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        startDate: true,
        endDate: true,
        completionPercentage: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: { id: true, name: true, isActive: true },
        },
        _count: {
          select: { tasks: true, deliverables: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return projects.map((p) => ({
      ...p,
      statusAr:
        PROJECT_STATUS_AR[p.status as keyof typeof PROJECT_STATUS_AR] ??
        p.status,
      taskCount: p._count.tasks,
      deliverableCount: p._count.deliverables,
      _count: undefined,
    }));
  }

  async getProjectReviewDetail(projectId: string, clientId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: { select: { id: true, name: true, isActive: true } },
        files: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
        revisionRequests: {
          select: {
            id: true,
            comment: true,
            createdAt: true,
            client: { select: { id: true, companyName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project || project.clientId !== clientId) {
      throw new NotFoundException("Project not found or access denied");
    }

    if (project.files && project.files.length > 0) {
      const fileKeys = project.files.map((f) => f.filePath);
      const urlMap =
        await this.storageService.getMultiplePresignedUrls(fileKeys);
      project.files = project.files.map((f) => ({
        ...f,
        url: urlMap.get(f.filePath) || null,
      })) as any;
    }

    return project;
  }

  async approveProject(projectId: string, clientId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.clientId !== clientId) {
      throw new NotFoundException("Project not found or access denied");
    }

    if (project.status !== ProjectStatus.AWAITING_REVIEW) {
      throw new BadRequestException("المشروع ليس بحالة انتظار المراجعة");
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.COMPLETED },
    });

    // Refresh the client's denormalized counters — approval moves the
    // project from AWAITING_REVIEW to COMPLETED, which changes
    // `completedProjects` on the KPI grid. Fire-and-forget so a counter
    // glitch never blocks the client's approval confirmation.
    this.clientCounterService
      .onProjectStatusChange(projectId)
      .catch(() => undefined);

    if (project.projectManagerId) {
      this.notificationsService
        .createNotification({
          entityId: projectId,
          entityType: "project",
          eventType: "PROJECT_APPROVED",
          userId: project.projectManagerId,
          title: "تمت الموافقة على المشروع",
          body: `تمت الموافقة على المشروع "${project.name}" من قبل العميل.`,
        })
        .catch(() => undefined);
    }

    // NEW: Broadcast invalidations for project approval
    await this.broadcastInvalidations(clientId, [
      "ReviewProjects",
      "ProjectProgress",
      "PortalProjects",
      "ActionItems",
      "ActivityFeed",
    ]);

    return updated;
  }

  async requestProjectRevision(
    projectId: string,
    clientId: string,
    dto: RequestProjectRevisionDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.clientId !== clientId) {
      throw new NotFoundException("Project not found or access denied");
    }

    if (project.status !== ProjectStatus.AWAITING_REVIEW) {
      throw new BadRequestException("المشروع ليس بحالة انتظار المراجعة");
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.NEEDS_REVISION },
      }),
      this.prisma.projectRevisionRequest.create({
        data: {
          projectId,
          clientId,
          comment: dto.comment,
        },
      }),
    ]);

    if (project.projectManagerId) {
      this.notificationsService
        .createNotification({
          entityId: projectId,
          entityType: "project",
          eventType: "PROJECT_REVISION_REQUESTED",
          userId: project.projectManagerId,
          title: "طلب العميل تعديلات على المشروع",
          body: `طلب العميل تعديلات على المشروع "${project.name}": ${dto.comment}`,
        })
        .catch(() => undefined);
    }

    // NEW: Broadcast invalidations for project revision
    await this.broadcastInvalidations(clientId, [
      "ReviewProjects",
      "ProjectProgress",
      "PortalProjects",
      "ActionItems",
      "ActivityFeed",
    ]);

    return updated;
  }

  async getProjectRevisions(projectId: string) {
    return this.prisma.projectRevisionRequest.findMany({
      where: { projectId },
      include: {
        client: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ── Marketing Strategy Portal Methods ──────────────────────────────────

  async getClientStrategies(clientId: string) {
    return this.prisma.marketingStrategy.findMany({
      where: { clientId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getClientStrategyOne(id: string, clientId: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        creator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    if (!strategy || strategy.clientId !== clientId) {
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    return strategy;
  }

  async approveStrategy(id: string, clientUserId: string) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
      include: {
        task: { select: { title: true, createdBy: true, assignedTo: true } },
      },
    });

    if (!strategy) {
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    // Verify client owns this strategy
    const client = await this.prisma.client.findUnique({
      where: { id: strategy.clientId },
      select: { userId: true },
    });

    if (!client?.userId || client.userId !== clientUserId) {
      throw new BadRequestException("غير مصرح بهذا الإجراء");
    }

    return this.marketingStrategyService.approve(id, clientUserId);
  }

  async requestStrategyRevision(
    id: string,
    clientUserId: string,
    comment: string,
  ) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException("الدراسة التسويقية غير موجودة");
    }

    // Verify client owns this strategy
    const client = await this.prisma.client.findUnique({
      where: { id: strategy.clientId },
      select: { userId: true },
    });

    if (!client?.userId || client.userId !== clientUserId) {
      throw new BadRequestException("غير مصرح بهذا الإجراء");
    }

    return this.marketingStrategyService.requestRevision(
      id,
      clientUserId,
      comment,
    );
  }
}
