import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDeliverableDto, CreateRevisionDto, CreateIntakeFormDto } from '../dto/portal.dto';
import { TaskStatus, ContractStatus, InvoiceStatus, ProposalStatus } from '@hassad/shared';
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

  async getActionItems(clientId: string) {
    const items: any[] = [];

    const now = new Date();

    const snoozedItems = await this.prisma.clientSnoozedItem.findMany({
      where: { clientId, snoozedUntil: { gt: now } },
      select: { itemType: true, itemId: true },
    });
    const snoozedKeys = new Set(snoozedItems.map((s) => `${s.itemType}-${s.itemId}`));

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
      orderBy: { createdAt: 'desc' },
    });

    for (const d of reviewDeliverables) {
      if (snoozedKeys.has(`DELIVERABLE_APPROVAL-${d.id}`)) continue;
      items.push({
        id: `del-${d.id}`,
        type: 'DELIVERABLE_APPROVAL',
        title: d.title,
        subtitle: `مشروع: ${d.project.name}`,
        actionUrl: `/portal/deliverables`,
        priority: 'high',
        createdAt: d.createdAt,
      });
    }

    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        clientId,
        status: { in: [InvoiceStatus.DUE, InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.LATE] },
      },
      orderBy: { dueDate: 'asc' },
    });

    for (const inv of unpaidInvoices) {
      if (snoozedKeys.has(`INVOICE_PAYMENT-${inv.id}`)) continue;
      const daysUntilDue = inv.dueDate
        ? Math.ceil((new Date(inv.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      let priority: string = 'low';
      if (daysUntilDue <= 3 || inv.status === InvoiceStatus.LATE) priority = 'high';
      else if (daysUntilDue <= 7) priority = 'normal';

      items.push({
        id: `inv-${inv.id}`,
        type: 'INVOICE_PAYMENT',
        title: `فاتورة ${inv.invoiceNumber}`,
        subtitle: `المبلغ: ${inv.amount.toLocaleString('ar-SA')} ر.س${daysUntilDue <= 3 ? ' — مستحقة قريباً' : ''}`,
        actionUrl: `/portal/finance`,
        dueDate: inv.dueDate,
        priority,
        createdAt: inv.createdAt,
      });
    }

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { leadId: true },
    });

    if (client?.leadId) {
      const pendingProposals = await this.prisma.proposal.findMany({
        where: { leadId: client.leadId, status: ProposalStatus.SENT },
        orderBy: { sentAt: 'desc' },
      });
      for (const p of pendingProposals) {
        if (snoozedKeys.has(`PROPOSAL_REVIEW-${p.id}`)) continue;
        items.push({
          id: `prop-${p.id}`,
          type: 'PROPOSAL_REVIEW',
          title: p.title,
          subtitle: 'عرض فني بانتظار مراجعتك',
          actionUrl: `/portal/proposals`,
          priority: 'normal',
          createdAt: p.sentAt ?? p.createdAt,
        });
      }

      const sentContracts = await this.prisma.contract.findMany({
        where: { clientId, status: ContractStatus.SENT },
        orderBy: { createdAt: 'desc' },
      });
      for (const c of sentContracts) {
        if (snoozedKeys.has(`CONTRACT_SIGN-${c.id}`)) continue;
        items.push({
          id: `con-${c.id}`,
          type: 'CONTRACT_SIGN',
          title: c.title,
          subtitle: 'عقد بانتظار توقيعك',
          actionUrl: `/portal/contracts`,
          priority: 'high',
          createdAt: c.createdAt,
        });
      }
    }

    items.sort((a, b) => {
      const prio = { high: 0, normal: 1, low: 2 };
      return (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2);
    });

    return { items };
  }

  async snoozeActionItem(clientId: string, itemType: string, itemId: string, hours: number = 24) {
    const snoozedUntil = new Date();
    snoozedUntil.setHours(snoozedUntil.getHours() + hours);

    return this.prisma.clientSnoozedItem.upsert({
      where: {
        clientId_itemType_itemId: { clientId, itemType, itemId },
      },
      update: { snoozedUntil },
      create: { clientId, itemType, itemId, snoozedUntil },
    });
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
      where: { projectId: { in: projectIds }, isVisibleToClient: true, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, title: true, status: true, createdAt: true, approvedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const d of recentDeliverables) {
      if (d.approvedAt) {
        items.push({
          id: `del-approve-${d.id}`,
          date: d.approvedAt,
          text: `تم اعتماد "${d.title}"`,
          icon: 'check',
        });
      }
      if (d.status === TaskStatus.REVISION) {
        items.push({
          id: `del-revision-${d.id}`,
          date: d.createdAt,
          text: `طلب تعديل على "${d.title}"`,
          icon: 'palette',
        });
      }
      items.push({
        id: `del-upload-${d.id}`,
        date: d.createdAt,
        text: `تم رفع "${d.title}"`,
        icon: 'file',
      });
    }

    const recentCampaigns = await this.prisma.campaign.findMany({
      where: { clientId, createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const c of recentCampaigns) {
      items.push({
        id: `camp-${c.id}`,
        date: c.createdAt,
        text: `تم إطلاق حملة "${c.name}"`,
        icon: 'trending',
      });
    }

    const recentPayments = await this.prisma.payment.findMany({
      where: { clientId, status: 'SUCCESS', date: { gte: thirtyDaysAgo } },
      select: { id: true, amount: true, date: true },
      orderBy: { date: 'desc' },
      take: 5,
    });

    for (const p of recentPayments) {
      items.push({
        id: `pay-${p.id}`,
        date: p.date,
        text: `تم دفع ${p.amount.toLocaleString('ar-SA')} ر.س`,
        icon: 'dollar',
      });
    }

    const historyLogs = await this.prisma.clientHistoryLog.findMany({
      where: { clientId, occurredAt: { gte: thirtyDaysAgo } },
      select: { id: true, eventType: true, description: true, occurredAt: true },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    for (const h of historyLogs) {
      items.push({
        id: `hist-${h.id}`,
        date: h.occurredAt,
        text: h.description,
        icon: 'file',
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const unique = items.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id),
    );

    return { items: unique.slice(0, 15) };
  }

  async getCampaignSummary(clientId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { clientId },
      select: { id: true, status: true },
    });

    if (campaigns.length === 0) {
      return { totalVisits: 0, totalConversions: 0, avgRoas: 0, improvementPercent: 0 };
    }

    const campaignIds = campaigns.map((c) => c.id);

    const latestSnapshots = await this.prisma.campaignKpiSnapshot.findMany({
      where: { campaignId: { in: campaignIds } },
      orderBy: { recordedAt: 'desc' },
      distinct: ['campaignId'],
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

    const avgRoas = roasCount > 0 ? Math.round((totalRoas / roasCount) * 10) / 10 : 0;

    let improvementPercent = 0;
    if (latestSnapshots.length > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const olderSnapshots = await this.prisma.campaignKpiSnapshot.findMany({
        where: {
          campaignId: { in: campaignIds },
          recordedAt: { lt: sevenDaysAgo },
        },
        orderBy: { recordedAt: 'desc' },
        distinct: ['campaignId'],
      });

      if (olderSnapshots.length > 0) {
        const olderTotalConversions = olderSnapshots.reduce((s, snap) => s + snap.conversions, 0);
        if (olderTotalConversions > 0) {
          improvementPercent = Math.round(
            ((totalConversions - olderTotalConversions) / olderTotalConversions) * 100,
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

