import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDeliverableDto, CreateRevisionDto, CreateIntakeFormDto } from '../dto/portal.dto';
import { TaskStatus } from '@hassad/shared';
import { randomBytes } from 'crypto';

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}



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

    return campaigns.map((c) => ({
      ...c,
      analytics: this.computeCampaignAnalytics(c),
    }));
  }

  async findCampaignOne(id: string, clientId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, clientId },
    });

    if (!campaign) {
      throw new NotFoundException("الحملة غير موجودة");
    }

    return {
      ...campaign,
      analytics: this.computeCampaignAnalytics(campaign),
    };
  }

  private computeCampaignAnalytics(c: any) {
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
}

