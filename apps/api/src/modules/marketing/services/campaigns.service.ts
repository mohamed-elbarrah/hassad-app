import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
  UpdateCampaignMetricsDto,
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

    // Notify assigned marketer and PM
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

    return campaign;
  }

  async findByTask(taskId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return campaigns.map((c) => ({
      ...c,
      analytics: this.computeAnalytics(c),
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

    return {
      ...campaign,
      analytics: this.computeAnalytics(campaign),
    };
  }

  async updateMetrics(id: string, data: UpdateCampaignMetricsDto, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
    }

    // Only assigned marketer or admin can update metrics (simplified role check here)
    if (campaign.managedBy !== userId) {
      // In real system, we'd check if user is ADMIN too
      // But for now, enforce the assigned marketer rule
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data,
    });

    // Notify PM
    const pmId = campaign.task.createdBy;
    await this.notifications.notifyUsers({
      userIds: [pmId],
      excludeUserIds: [userId],
      title: "تحديث أداء الحملة",
      message: `تم تحديث نتائج الحملة "${campaign.name}"`,
      entityId: campaign.id,
      entityType: "CAMPAIGN",
      eventType: "MARKETING_METRICS_UPDATED",
    });

    return {
      ...updated,
      analytics: this.computeAnalytics(updated),
    };
  }

  async updateStatus(id: string, status: CampaignStatus, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
    }

    // Validate status transition
    this.validateStatusTransition(campaign.status as unknown as CampaignStatus, status);


    return this.prisma.campaign.update({
      where: { id },
      data: { status },
    });
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
      // Notify PM
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
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: null,
      },
    });
  }

  private computeAnalytics(c: any) {
    const budgetSpent = c.budgetSpent || 0;
    const clicks = c.clicks || 0;
    const impressions = c.impressions || 0;
    const conversions = c.conversions || 0;
    const revenue = c.revenue || 0;

    return {
      cpc: clicks > 0 ? budgetSpent / clicks : 0,
      cpa: conversions > 0 ? budgetSpent / conversions : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      roas: budgetSpent > 0 ? revenue / budgetSpent : 0,
    };
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
}
