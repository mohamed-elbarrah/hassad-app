import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import {
  CampaignStatus,
  CampaignPlatform,
  TaskDepartment,
} from "@hassad/shared";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignMetricsDto,
  CampaignQueryDto,
} from "../dto/campaign.dto";

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(data: CreateCampaignDto, creatorId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: data.taskId },
      include: { department: true },
    });

    if (!task) {
      throw new NotFoundException("المهمة غير موجودة");
    }

    if (task.department?.name !== "MARKETING") {
      throw new BadRequestException("يجب أن تكون المهمة من نوع تسويق");
    }

    if (!task.assignedTo) {
      throw new BadRequestException("يجب إسناد المهمة لمسوق أولاً");
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        ...data,
        managedBy: task.assignedTo,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    const pmId = task.createdBy;
    const marketerId = task.assignedTo;

    await this.notifications.notifyUsers({
      userIds: [pmId, marketerId],
      excludeUserIds: [creatorId],
      title: "حملة جديدة",
      message: `تم إنشاء حملة جديدة "${campaign.name}" للمهمة "${task.title}"`,
      entityId: campaign.id,
      entityType: "CAMPAIGN",
      eventType: "MARKETING_CAMPAIGN_CREATED",
    });

    this.notifyClientAboutCampaign(campaign.id, "MARKETING_CAMPAIGN_CREATED",
      "تم إطلاق حملة جديدة",
      `تم إطلاق حملة "${campaign.name}" لمشروعك`).catch(() => undefined);

    return campaign;
  }

  async findAll(query: CampaignQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: any = {};

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
      throw new NotFoundException("الحملة غير موجودة");
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.platform !== undefined) data.platform = dto.platform;
    if (dto.budgetTotal !== undefined) data.budgetTotal = dto.budgetTotal;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;

    const updated = await this.prisma.campaign.update({
      where: { id },
      data,
    });

    const analytics = await this.getLatestAnalytics(id);
    return { ...updated, analytics };
  }

  async findByTask(taskId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { taskId },
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
      throw new NotFoundException("الحملة غير موجودة");
    }

    const analytics = await this.getLatestAnalytics(id);
    return { ...campaign, analytics };
  }

  async createKpiSnapshot(id: string, data: UpdateCampaignMetricsDto, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
    }

    const impressions = data.impressions ?? 0;
    const clicks = data.clicks ?? 0;
    const conversions = data.conversions ?? 0;
    const revenue = data.revenue ?? 0;
    const budgetSpent = data.budgetSpent ?? campaign.budgetSpent;

    const snapshot = await this.prisma.campaignKpiSnapshot.create({
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
        source: "manual",
      },
    });

    if (data.budgetSpent !== undefined) {
      await this.prisma.campaign.update({
        where: { id },
        data: { budgetSpent: data.budgetSpent },
      });
    }

    await this.createAuditLog(id, snapshot.id, data, userId);

    const pmId = campaign.task?.createdBy;
    if (pmId) {
      await this.notifications.notifyUsers({
        userIds: [pmId],
        excludeUserIds: [userId],
        title: "تحديث أداء الحملة",
        message: `تم تحديث نتائج الحملة "${campaign.name}"`,
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_METRICS_UPDATED",
      });
    }

    this.notifyClientAboutCampaign(campaign.id, "MARKETING_METRICS_UPDATED",
      "تحديث أداء الحملة",
      `تم تحديث نتائج الحملة "${campaign.name}"`).catch(() => undefined);

    return snapshot;
  }

  async getKpiSnapshots(id: string, query?: { from?: string; to?: string }) {
    const where: any = { campaignId: id };
    if (query?.from || query?.to) {
      where.recordedAt = {};
      if (query.from) where.recordedAt.gte = new Date(query.from);
      if (query.to) where.recordedAt.lte = new Date(query.to);
    }

    return this.prisma.campaignKpiSnapshot.findMany({
      where,
      orderBy: { recordedAt: "asc" },
    });
  }

  async updateStatus(id: string, status: CampaignStatus, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { task: { select: { createdBy: true } } },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
    }

    this.validateStatusTransition(campaign.status as unknown as CampaignStatus, status);

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status },
    });

    const pmId = campaign.task?.createdBy;
    if (pmId) {
      await this.notifications.notifyUsers({
        userIds: [pmId],
        excludeUserIds: [userId],
        title: 'تحديث حالة الحملة',
        message: `تم تغيير حالة الحملة "${campaign.name}" إلى ${status}`,
        entityId: campaign.id,
        entityType: 'CAMPAIGN',
        eventType: 'MARKETING_CAMPAIGN_STATUS_CHANGED',
      });
    }

    this.notifyClientAboutCampaign(id, "MARKETING_CAMPAIGN_STATUS_CHANGED",
      "تحديث حالة الحملة",
      `تم تغيير حالة حملة "${campaign.name}" إلى ${status}`).catch(() => undefined);

    return updated;
  }

  async flagOptimization(id: string, needsOptimization: boolean, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
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
        title: "حملة تحتاج تحسين",
        message: `تم وضع علامة "تحتاج تحسين" على الحملة "${campaign.name}"`,
        entityId: campaign.id,
        entityType: "CAMPAIGN",
        eventType: "MARKETING_OPTIMIZATION_REQUIRED",
      });

      this.notifyClientAboutCampaign(id, "MARKETING_OPTIMIZATION_REQUIRED",
        "حملة تحتاج تحسين",
        `تم وضع علامة "تحتاج تحسين" على الحملة "${campaign.name}"`).catch(() => undefined);
    }

    return updated;
  }

  async duplicate(id: string, userId: string) {
    const original = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!original) {
      throw new NotFoundException("الحملة الأصلية غير موجودة");
    }

    const { id: _, createdAt: __, updatedAt: ___, ...data } = original;

    return this.prisma.campaign.create({
      data: {
        ...data,
        name: `${original.name} (نسخة)`,
        status: CampaignStatus.PLANNING,
        budgetSpent: 0,
      },
    });
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

  private async createAuditLog(campaignId: string, snapshotId: string, data: UpdateCampaignMetricsDto, userId: string | null) {
    const fields = [
      { field: "impressions", newValue: String(data.impressions ?? 0) },
      { field: "clicks", newValue: String(data.clicks ?? 0) },
      { field: "conversions", newValue: String(data.conversions ?? 0) },
      { field: "revenue", newValue: String(data.revenue ?? 0) },
      { field: "budgetSpent", newValue: String(data.budgetSpent ?? 0) },
    ];

    await this.prisma.campaignKpiAuditLog.createMany({
      data: fields.map((f) => ({
        campaignId,
        snapshotId,
        field: f.field,
        newValue: f.newValue,
        changedBy: userId,
      })),
    });
  }

  private validateStatusTransition(current: CampaignStatus, next: CampaignStatus) {
    const allowed: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.PLANNING]: [CampaignStatus.ACTIVE, CampaignStatus.STOPPED],
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
      throw new BadRequestException(
        `لا يمكن الانتقال من حالة ${current} إلى ${next}`,
      );
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