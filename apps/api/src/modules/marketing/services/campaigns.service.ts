import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { NotificationsService } from "../../notifications/services/notifications.service";
import {
  CampaignStatus,
  CampaignPlatform,
  KpiSource,
  TaskDepartment,
  MarketingStrategyStatus,
} from "@hassad/shared";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignMetricsDto,
  CampaignQueryDto,
  KpiSnapshotQueryDto,
} from "../dto/campaign.dto";

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private readonly logger = new Logger(CampaignsService.name);

  async create(data: CreateCampaignDto, creatorId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: data.taskId },
      include: {
        department: true,
        project: {
          select: { clientId: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException({ code: "MARKETING_TASK_NOT_FOUND", details: {} });
    }

    if (task.department?.name !== "MARKETING") {
      throw new BadRequestException({ code: "MARKETING_TASK_DEPARTMENT_REQUIRED", details: {} });
    }

    if (!task.assignedTo) {
      throw new BadRequestException({ code: "MARKETING_TASK_UNASSIGNED", details: {} });
    }

    if (!task.project?.clientId) {
      throw new BadRequestException({ code: "MARKETING_TASK_CLIENT_REQUIRED", details: {} });
    }

    // Enforce: marketing strategy must be APPROVED before creating campaigns
    const approvedStrategy = await this.prisma.marketingStrategy.findFirst({
      where: {
        taskId: data.taskId,
        status: MarketingStrategyStatus.APPROVED,
      },
    });

    if (!approvedStrategy) {
      throw new BadRequestException(
        "يجب الموافقة على الدراسة التسويقية أولاً قبل إنشاء الحملات",
      );
    }

    const { taskId, name, platform, startDate, endDate, budgetTotal } = data;
    if (endDate && new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException({ code: "INVALID_DATE_RANGE", details: {} });
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        taskId,
        name,
        platform,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budgetTotal,
        clientId: task.project.clientId,
        managedBy: task.assignedTo,
        createdBy: creatorId,
      },
    });

    const pmId = task.createdBy;
    const marketerId = task.assignedTo;

    await this.notifications.notifyUsers({
      userIds: [pmId, marketerId],
      excludeUserIds: [creatorId],
      entityId: campaign.id,
      entityType: "CAMPAIGN",
      eventType: "MARKETING_CAMPAIGN_CREATED",
    });

    this.notifyClientAboutCampaign(
      campaign.id,
      "MARKETING_CAMPAIGN_CREATED",
      "تم إطلاق حملة جديدة",
      `تم إطلاق حملة "${campaign.name}" لمشروعك`,
    ).catch((error) => {
      this.logger.error(
        `Failed to notify client about campaign creation: campaignId=${campaign.id}, eventType=MARKETING_CAMPAIGN_CREATED`,
        error instanceof Error ? error.stack : String(error),
      );
    });

    return campaign;
  }

  async findAll(query: CampaignQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: Prisma.CampaignWhereInput = { isArchived: false };

    if (query.status) {
      where.status = query.status;
    }
    if (query.clientId) {
      where.clientId = query.clientId;
    }
    if (query.taskId) {
      where.taskId = query.taskId;
    }

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: { client: { select: { id: true, companyName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    const campaignIds = data.map((c) => c.id);
    const snapshots = await this.getLatestSnapshots(campaignIds);

    return {
      data: data.map((c) => ({
        ...c,
        analytics: snapshots[c.id] ?? this.emptyAnalytics(),
      })),
      total,
      page,
      limit,
    };
  }

  // userId scopes Marketing-owned calls; omitted for privileged generic campaign routes.
  async update(id: string, dto: UpdateCampaignDto, userId?: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        ...(userId ? { OR: [{ managedBy: userId }, { createdBy: userId }] } : {}),
      },
    });
    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    if (
      campaign.status === CampaignStatus.STOPPED ||
      campaign.status === CampaignStatus.COMPLETED
    ) {
      throw new BadRequestException({ code: "CAMPAIGN_NOT_EDITABLE", details: {} });
    }

    const data: Prisma.CampaignUpdateInput = {};
    const effectiveStart = dto.startDate ? new Date(dto.startDate) : campaign.startDate;
    const effectiveEnd = dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : campaign.endDate;
    if (effectiveEnd && effectiveEnd < effectiveStart) {
      throw new BadRequestException({ code: "INVALID_DATE_RANGE", details: {} });
    }
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.platform !== undefined) {
      if (campaign.status !== CampaignStatus.PLANNING) {
        throw new BadRequestException({ code: "CAMPAIGN_PLATFORM_LOCKED", details: {} });
      }
      data.platform = dto.platform;
    }
    if (dto.budgetTotal !== undefined) data.budgetTotal = dto.budgetTotal;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;

    const updated = await this.prisma.campaign.update({
      where: { id },
      data,
    });

    const analytics = await this.getLatestAnalytics(id);
    return { ...updated, analytics };
  }

  async findByTask(taskId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { taskId, isArchived: false },
      orderBy: { createdAt: "desc" },
    });

    const snapshots = await this.getLatestSnapshots(campaigns.map((c) => c.id));

    return campaigns.map((c) => ({
      ...c,
      analytics: snapshots[c.id] ?? this.emptyAnalytics(),
    }));
  }

  // userId scopes Marketing-owned calls; omitted for privileged generic campaign routes.
  async findOne(id: string, userId?: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        ...(userId ? { OR: [{ managedBy: userId }, { createdBy: userId }] } : {}),
      },
      include: { client: true, task: true, project: true },
    });

    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    const analytics = await this.getLatestAnalytics(id);
    return { ...campaign, analytics };
  }

  async myStats(userId: string, userRole?: string) {
    // PMs and admins see all campaigns across projects they manage
    // Marketers see only their assigned campaigns
    const where: Prisma.CampaignWhereInput = { isArchived: false };

    if (userRole === "ADMIN" || userRole === "PM") {
      where.task = {
        createdBy: userId,
      };
    } else {
      where.OR = [{ managedBy: userId }, { createdBy: userId }];
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      include: {
        kpiSnapshots: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    });

    const activeCampaigns = campaigns.filter(
      (c) => c.status === CampaignStatus.ACTIVE,
    ).length;
    const totalBudgetUsed = campaigns.reduce(
      (sum, c) => sum + c.budgetSpent,
      0,
    );
    const campaignsWithRoas = campaigns.filter(
      (c) => c.kpiSnapshots.length > 0,
    );
    const avgRoas =
      campaignsWithRoas.length > 0
        ? campaignsWithRoas.reduce(
            (sum, c) => sum + c.kpiSnapshots[0].roas,
            0,
          ) / campaignsWithRoas.length
        : 0;

    return { activeCampaigns, totalBudgetUsed, avgRoas };
  }

  async createKpiSnapshot(
    id: string,
    data: UpdateCampaignMetricsDto,
    userId: string,
    ownerUserId?: string,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        ...(ownerUserId ? { OR: [{ managedBy: ownerUserId }, { createdBy: ownerUserId }] } : {}),
      },
      include: {
        task: true,
        kpiSnapshots: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });

    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    if (campaign.isArchived) {
      throw new BadRequestException({ code: "CAMPAIGN_ARCHIVED", details: {} });
    }

    const latest = campaign.kpiSnapshots[0];
    const impressions = data.impressions ?? latest?.impressions ?? 0;
    const clicks = data.clicks ?? latest?.clicks ?? 0;
    const conversions = data.conversions ?? latest?.conversions ?? 0;
    const revenue = data.revenue ?? latest?.revenue ?? 0;
    const budgetSpent = data.budgetSpent ?? campaign.budgetSpent;

    const [snapshot] = await this.prisma.$transaction(async (tx) => {
      const snap = await tx.campaignKpiSnapshot.create({
        data: {
          campaignId: id,
          impressions,
          clicks,
          conversions,
          revenue,
          cpc: clicks > 0 ? budgetSpent / clicks : 0,
          cpa: conversions > 0 ? budgetSpent / conversions : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
          roas: budgetSpent > 0 ? revenue / budgetSpent : 0,
          source: KpiSource.MANUAL,
        },
      });

      if (data.budgetSpent !== undefined) {
        await tx.campaign.update({
          where: { id },
          data: { budgetSpent: data.budgetSpent },
        });
      }

      await tx.campaignKpiAuditLog.createMany({
        data: [
          {
            campaignId: id,
            snapshotId: snap.id,
            field: "impressions",
            newValue: String(impressions),
            changedBy: userId,
          },
          {
            campaignId: id,
            snapshotId: snap.id,
            field: "clicks",
            newValue: String(clicks),
            changedBy: userId,
          },
          {
            campaignId: id,
            snapshotId: snap.id,
            field: "conversions",
            newValue: String(conversions),
            changedBy: userId,
          },
          {
            campaignId: id,
            snapshotId: snap.id,
            field: "revenue",
            newValue: String(revenue),
            changedBy: userId,
          },
          {
            campaignId: id,
            snapshotId: snap.id,
            field: "budgetSpent",
            newValue: String(budgetSpent),
            changedBy: userId,
          },
        ],
      });

      return [snap];
    });

    const pmId = campaign.task?.createdBy;
    if (pmId) {
      await this.notifications.notifyUsers({
        userIds: [pmId],
        excludeUserIds: [userId],
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_METRICS_UPDATED",
      });
    }

    this.notifyClientAboutCampaign(
      campaign.id,
      "MARKETING_METRICS_UPDATED",
      "تحديث أداء الحملة",
      `تم تحديث نتائج الحملة "${campaign.name}"`,
    ).catch((error) => {
      this.logger.error(
        `Failed to notify client about metrics update: campaignId=${campaign.id}, eventType=MARKETING_METRICS_UPDATED`,
        error instanceof Error ? error.stack : String(error),
      );
    });

    return snapshot;
  }

  // userId scopes Marketing-owned KPI history; omitted for generic/admin capabilities.
  async getKpiSnapshots(id: string, query?: KpiSnapshotQueryDto, userId?: string) {
    if (userId) {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id, OR: [{ managedBy: userId }, { createdBy: userId }] },
        select: { id: true },
      });
      if (!campaign) throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }
    const where: Prisma.CampaignKpiSnapshotWhereInput = { campaignId: id };
    if (query?.from && query?.to && new Date(query.from) > new Date(query.to)) {
      throw new BadRequestException({ code: "INVALID_DATE_RANGE", details: {} });
    }
    if (query?.from || query?.to) {
      where.recordedAt = {};
      if (query.from) where.recordedAt.gte = new Date(query.from);
      if (query.to) where.recordedAt.lte = new Date(query.to);
    }

    const page = query?.page ?? 1;
    const limit = query?.limit ? Math.min(query.limit, 100) : 20;
    const [items, total] = await Promise.all([
      this.prisma.campaignKpiSnapshot.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaignKpiSnapshot.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: CampaignStatus, userId: string, ownerUserId?: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        ...(ownerUserId ? { OR: [{ managedBy: ownerUserId }, { createdBy: ownerUserId }] } : {}),
      },
      include: { task: { select: { createdBy: true } } },
    });

    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    if (campaign.isArchived) {
      throw new BadRequestException({ code: "CAMPAIGN_ARCHIVED", details: {} });
    }

    this.validateStatusTransition(
      campaign.status as unknown as CampaignStatus,
      status,
    );

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status },
    });

    // Write status transition history
    await this.prisma.campaignStatusHistory.create({
      data: {
        campaignId: id,
        fromStatus: campaign.status as unknown as CampaignStatus,
        toStatus: status,
        changedBy: userId,
      },
    });

    const STATUS_AR: Record<string, string> = {
      PLANNING: "تخطيط",
      ACTIVE: "نشطة",
      PAUSED: "متوقفة",
      STOPPED: "منتهية",
      COMPLETED: "مكتملة",
    };

    const pmId = campaign.task?.createdBy;
    if (pmId) {
      await this.notifications.notifyUsers({
        userIds: [pmId],
        excludeUserIds: [userId],
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_CAMPAIGN_STATUS_CHANGED",
      });
    }

    this.notifyClientAboutCampaign(
      id,
      "MARKETING_CAMPAIGN_STATUS_CHANGED",
      "تحديث حالة الحملة",
      `تم تغيير حالة حملة "${campaign.name}" إلى ${STATUS_AR[status] ?? status}`,
    ).catch((error) => {
      this.logger.error(
        `Failed to notify client about status change: campaignId=${id}, eventType=MARKETING_CAMPAIGN_STATUS_CHANGED`,
        error instanceof Error ? error.stack : String(error),
      );
    });

    return updated;
  }

  async flagOptimization(
    id: string,
    needsOptimization: boolean,
    userId: string,
    ownerUserId?: string,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        ...(ownerUserId ? { OR: [{ managedBy: ownerUserId }, { createdBy: ownerUserId }] } : {}),
      },
      include: { task: true },
    });

    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { needsOptimization },
    });

    if (needsOptimization) {
      const pmId = campaign.task.createdBy;
      await this.notifications.notifyUsers({
        userIds: [pmId],
        excludeUserIds: [userId],
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_OPTIMIZATION_REQUIRED",
      });

      this.notifyClientAboutCampaign(
        id,
        "MARKETING_OPTIMIZATION_REQUIRED",
        "حملة تحتاج تحسين",
        `تم وضع علامة "تحتاج تحسين" على الحملة "${campaign.name}"`,
      ).catch((error) => {
        this.logger.error(
          `Failed to notify client about optimization flag: campaignId=${id}, eventType=MARKETING_OPTIMIZATION_REQUIRED`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }

    return updated;
  }

  async archive(id: string, userId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, OR: [{ managedBy: userId }, { createdBy: userId }] },
    });

    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    if (campaign.isArchived) {
      throw new BadRequestException({ code: "CAMPAIGN_ARCHIVED", details: {} });
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async unarchive(id: string, userId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, OR: [{ managedBy: userId }, { createdBy: userId }] },
    });

    if (!campaign) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    if (!campaign.isArchived) {
      throw new BadRequestException({ code: "CAMPAIGN_NOT_ARCHIVED", details: {} });
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { isArchived: false },
    });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.campaign.findFirst({
      where: { id, OR: [{ managedBy: userId }, { createdBy: userId }] },
    });

    if (!original) {
      throw new NotFoundException({ code: "CAMPAIGN_NOT_FOUND", details: {} });
    }

    const {
      id: _,
      createdAt: __,
      updatedAt: ___,
      budgetSpent,
      needsOptimization,
      ...data
    } = original;

    return this.prisma.campaign.create({
      data: {
        ...data,
        name: `${original.name} (نسخة)`,
        status: CampaignStatus.PLANNING,
        budgetSpent: 0,
        needsOptimization: false,
        managedBy: userId,
      },
    });
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

  private validateStatusTransition(
    current: CampaignStatus,
    next: CampaignStatus,
  ) {
    const allowed: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.PLANNING]: [
        CampaignStatus.ACTIVE,
        CampaignStatus.STOPPED,
      ],
      [CampaignStatus.ACTIVE]: [
        CampaignStatus.PAUSED,
        CampaignStatus.STOPPED,
        CampaignStatus.COMPLETED,
      ],
      [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.STOPPED],
      [CampaignStatus.STOPPED]: [],
      [CampaignStatus.COMPLETED]: [],
    };

    if (!allowed[current].includes(next)) {
      throw new BadRequestException({
        code: "CAMPAIGN_INVALID_STATUS_TRANSITION",
        details: { current, next },
      });
    }
  }

  private async notifyClientAboutCampaign(
    campaignId: string,
    eventType: string,
    title: string,
    body: string,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { name: true, clientId: true },
    });
    if (!campaign?.clientId) return;

    const clientUser = await this.prisma.client.findUnique({
      where: { id: campaign.clientId },
      select: { userId: true },
    });
    if (!clientUser?.userId) return;

    await this.notifications.createNotification({
      entityId: campaignId,
      entityType: "campaign",
      eventType,
      userId: clientUser.userId,
      title,
      body,
    });
  }
}
