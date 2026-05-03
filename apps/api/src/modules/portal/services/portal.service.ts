import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDeliverableDto, CreateRevisionDto, CreateIntakeFormDto } from '../dto/portal.dto';
import { TaskStatus, ContractStatus, InvoiceStatus } from '@hassad/shared';
import { randomBytes } from 'crypto';

const TASK_STATUS_AR_MAP: Record<string, string> = {
  TODO: 'لم يبدأ',
  IN_PROGRESS: 'جاري العمل',
  IN_REVIEW: 'قيد المراجعة',
  DONE: 'مكتمل',
  REVISION: 'تعديل مطلوب',
};

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(clientId: string) {
    const [contracts, invoices, projects, campaigns] = await Promise.all([
      this.prisma.contract.findMany({
        where: { clientId, status: ContractStatus.SIGNED },
        select: { id: true, title: true, status: true, totalValue: true, startDate: true, endDate: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.invoice.findMany({
        where: { clientId },
        select: {
          id: true, invoiceNumber: true, amount: true, status: true, dueDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.project.findMany({
        where: { clientId },
        select: { id: true, name: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.campaign.findMany({
        where: { clientId },
        select: { id: true, name: true, status: true, platform: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalContractValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
    const unpaidInvoices = invoices.filter((i) => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED);
    const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);

    const projectProgress = await this.getProjectProgress(clientId);

    return {
      summary: {
        totalContracts: contracts.length,
        totalContractValue,
        totalOutstanding,
        activeProjects: projects.filter((p) => p.status === 'ACTIVE').length,
        activeCampaigns: campaigns.length,
      },
      recentContracts: contracts,
      recentInvoices: invoices,
      recentProjects: projects,
      recentCampaigns: campaigns,
      projectProgress,
    };
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
        deliverables: {
          where: { isVisibleToClient: true },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (projects.length === 0) return null;

    const project = projects[0];

    const totalDeliverables = project.deliverables.length;
    const doneDeliverables = project.deliverables.filter((d) => d.status === TaskStatus.DONE).length;
    const progress = totalDeliverables > 0
      ? Math.round((doneDeliverables / totalDeliverables) * 100)
      : 0;

    const activeDeliverable = project.deliverables.find(
      (d) => d.status === TaskStatus.IN_PROGRESS || d.status === TaskStatus.IN_REVIEW,
    );
    
    const nextTodo = project.deliverables.find((d) => d.status === TaskStatus.TODO);
    const currentPhase = activeDeliverable?.title
      ?? (nextTodo?.title ?? 'لا توجد مرحلة حالية');

    const deliverables = project.deliverables.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      statusAr: TASK_STATUS_AR_MAP[d.status] ?? d.status,
      createdAt: d.createdAt,
    }));

    return {
      projectId: project.id,
      projectName: project.name,
      status: project.status,
      progress,
      currentPhase,
      projectManager: project.manager
        ? { id: project.manager.id, name: project.manager.name, isOnline: project.manager.isActive }
        : null,
      deliverables,
      startDate: project.startDate,
      endDate: project.endDate,
    };
  }

  async getContracts(clientId: string, query: { status?: string; page: number; limit: number }) {
    const where: any = { clientId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: { proposal: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.contract.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async getInvoices(clientId: string, query: { status?: string; page: number; limit: number }) {
    const where: any = { clientId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { contract: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async createDeliverable(userId: string, dto: CreateDeliverableDto) {
    return this.prisma.deliverable.create({
      data: {
        ...dto,
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

    return deliverable;
  }

  async approveDeliverable(id: string, userId: string) {
    return this.prisma.deliverable.update({
      where: { id },
      data: {
        status: TaskStatus.DONE,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });
  }

  async rejectDeliverable(id: string) {
    return this.prisma.deliverable.update({
      where: { id },
      data: { status: TaskStatus.REVISION },
    });
  }

  async createRevision(id: string, clientId: string, dto: CreateRevisionDto) {
    return this.prisma.clientRevisionRequest.create({
      data: {
        deliverableId: id,
        clientId,
        requestDescription: dto.requestDescription,
        status: TaskStatus.REVISION,
      },
    });
  }

  async getRevisions(id: string) {
    return this.prisma.clientRevisionRequest.findMany({
      where: { deliverableId: id },
    });
  }

  async findDeliverablesByProject(projectId: string) {
    return this.prisma.deliverable.findMany({
      where: { projectId },
      include: { revisionRequests: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDeliverablesByClient(clientId: string) {
    const projects = await this.prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);
    return this.prisma.deliverable.findMany({
      where: { projectId: { in: projectIds } },
      include: { project: { select: { id: true, name: true } }, revisionRequests: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIntakeForm(clientId: string, dto: CreateIntakeFormDto) {
    const token = randomBytes(32).toString('hex');
    return this.prisma.portalIntakeForm.create({
      data: {
        clientId,
        token,
        ...dto,
      },
    });
  }

  async getIntakeForm(clientId: string) {
    return this.prisma.portalIntakeForm.findMany({
      where: { clientId },
    });
  }

  async findCampaignsByClient(clientId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId },
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
      where: { id, clientId },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
    }

    const analytics = await this.getLatestAnalytics(id);
    return { ...campaign, analytics };
  }

  private async getLatestSnapshots(campaignIds: string[]): Promise<Record<string, any>> {
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
}

