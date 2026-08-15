import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ApiException } from "../../../common/errors/api-error";
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
      throw new NotFoundException("Task not found");
    }

    if (task.department?.name !== "MARKETING") {
      throw new ApiException("CAMPAIGN_MARKETING_TASK_REQUIRED", "Task must be a marketing task", 400);
    }

    if (!task.assignedTo) {
      throw new ApiException("CAMPAIGN_MARKETER_REQUIRED", "The task must be assigned to a marketer first", 400);
    }

    if (!task.project?.clientId) {
      throw new ApiException("CAMPAIGN_CONTEXT_MISSING", "Task is not linked to a project or client", 400);
    }

    // Enforce: marketing strategy must be APPROVED before creating campaigns
    const approvedStrategy = await this.prisma.marketingStrategy.findFirst({
      where: {
        taskId: data.taskId,
        status: MarketingStrategyStatus.APPROVED,
      },
    });

    if (!approvedStrategy) {
      throw new ApiException(
        "CAMPAIGN_STRATEGY_NOT_APPROVED",
        "The marketing strategy must be approved before campaigns can be created",
        400,
      );
    }

    const { taskId, name, platform, startDate, endDate, budgetTotal } = data;

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
      },
    });

    const pmId = task.createdBy;
    const marketerId = task.assignedTo;

    await this.notifications.notifyUsersWithMessage({
      userIds: [pmId, marketerId],
      excludeUserIds: [creatorId],
      messageKey: "campaign.created",
      messageParams: { campaignName: campaign.name, taskTitle: task.title },
      entityId: campaign.id,
      entityType: "CAMPAIGN",
      eventType: "MARKETING_CAMPAIGN_CREATED",
    });

    this.notifyClientAboutCampaign(
      campaign.id,
      "MARKETING_CAMPAIGN_CREATED",
      "campaign.launched",
      { campaignName: campaign.name },
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
    const where: any = { isArchived: false };

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

  async update(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (
      campaign.status === CampaignStatus.STOPPED ||
      campaign.status === CampaignStatus.COMPLETED
    ) {
      throw new ApiException("CAMPAIGN_NOT_EDITABLE", "Completed or stopped campaigns cannot be edited", 400);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.platform !== undefined) {
      if (campaign.status !== CampaignStatus.PLANNING) {
        throw new ApiException("CAMPAIGN_PLATFORM_LOCKED", "The campaign platform cannot be changed after activation", 400);
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

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { client: true, task: true, project: true },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const analytics = await this.getLatestAnalytics(id);
    return { ...campaign, analytics };
  }

  async myStats(userId: string, userRole?: string) {
    // PMs and admins see all campaigns across projects they manage
    // Marketers see only their assigned campaigns
    const where: any = { isArchived: false };

    if (userRole === "ADMIN" || userRole === "PM") {
      where.task = {
        createdBy: userId,
      };
    } else {
      where.task = {
        assignedTo: userId,
      };
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
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        task: true,
        kpiSnapshots: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.isArchived) {
      throw new ApiException("CAMPAIGN_ARCHIVED", "Archived campaign data cannot be updated", 400);
    }

    const latest: any = campaign.kpiSnapshots[0] ?? {};
    const impressions = data.impressions ?? latest.impressions ?? 0;
    const clicks = data.clicks ?? latest.clicks ?? 0;
    const conversions = data.conversions ?? latest.conversions ?? 0;
    const revenue = data.revenue ?? latest.revenue ?? 0;
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
      await this.notifications.notifyUsersWithMessage({
        userIds: [pmId],
        excludeUserIds: [userId],
        messageKey: "campaign.performance_updated",
        messageParams: { campaignName: campaign.name },
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_METRICS_UPDATED",
      });
    }

    this.notifyClientAboutCampaign(
      campaign.id,
      "MARKETING_METRICS_UPDATED",
      "campaign.performance_updated",
      { campaignName: campaign.name },
    ).catch((error) => {
      this.logger.error(
        `Failed to notify client about metrics update: campaignId=${campaign.id}, eventType=MARKETING_METRICS_UPDATED`,
        error instanceof Error ? error.stack : String(error),
      );
    });

    return snapshot;
  }

  async getKpiSnapshots(id: string, query?: KpiSnapshotQueryDto) {
    const where: any = { campaignId: id };
    if (query?.from || query?.to) {
      where.recordedAt = {};
      if (query.from) where.recordedAt.gte = new Date(query.from);
      if (query.to) where.recordedAt.lte = new Date(query.to);
    }

    const limit = query?.limit ? Math.min(query.limit, 500) : 500;

    return this.prisma.campaignKpiSnapshot.findMany({
      where,
      orderBy: { recordedAt: "asc" },
      take: limit,
    });
  }

  async updateStatus(id: string, status: CampaignStatus, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { task: { select: { createdBy: true } } },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.isArchived) {
      throw new ApiException("CAMPAIGN_ARCHIVED", "The status of an archived campaign cannot be changed", 400);
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

    const STATUS_LABELS: Record<string, string> = {
      PLANNING: "Planning",
      ACTIVE: "Active",
      PAUSED: "Paused",
      STOPPED: "Stopped",
      COMPLETED: "Completed",
    };

    const pmId = campaign.task?.createdBy;
    if (pmId) {
      await this.notifications.notifyUsersWithMessage({
        userIds: [pmId],
        excludeUserIds: [userId],
        messageKey: "campaign.status_changed",
        messageParams: { campaignName: campaign.name, status: STATUS_LABELS[status] ?? status },
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_CAMPAIGN_STATUS_CHANGED",
      });
    }

    this.notifyClientAboutCampaign(
      id,
      "MARKETING_CAMPAIGN_STATUS_CHANGED",
      "campaign.status_changed",
      { campaignName: campaign.name, status: STATUS_LABELS[status] ?? status },
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
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { needsOptimization },
    });

    if (needsOptimization) {
      const pmId = campaign.task.createdBy;
      await this.notifications.notifyUsersWithMessage({
        userIds: [pmId],
        excludeUserIds: [userId],
        messageKey: "campaign.optimization_needed",
        messageParams: { campaignName: campaign.name },
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_OPTIMIZATION_REQUIRED",
      });

      this.notifyClientAboutCampaign(
        id,
        "MARKETING_OPTIMIZATION_REQUIRED",
        "campaign.optimization_needed",
        { campaignName: campaign.name },
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
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (campaign.isArchived) {
      throw new ApiException("CAMPAIGN_ALREADY_ARCHIVED", "Campaign is already archived", 400);
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async unarchive(id: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }

    if (!campaign.isArchived) {
      throw new ApiException("CAMPAIGN_NOT_ARCHIVED", "Campaign is not archived", 400);
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { isArchived: false },
    });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!original) {
      throw new NotFoundException("Original campaign not found");
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
        name: `${original.name} (copy)`,
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
      throw new ApiException(
        "CAMPAIGN_INVALID_STATUS_TRANSITION",
        `Cannot transition from ${current} to ${next}`,
        400,
        { currentStatus: current, requestedStatus: next },
      );
    }
  }

  private async notifyClientAboutCampaign(
    campaignId: string,
    eventType: string,
    messageKey: "campaign.launched" | "campaign.performance_updated" | "campaign.status_changed" | "campaign.optimization_needed",
    messageParams: Record<string, string>,
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

    await this.notifications.createLocalizedNotification({
      entityId: campaignId,
      entityType: "campaign",
      eventType,
      userId: clientUser.userId,
      messageKey,
      messageParams,
    });
  }
}
