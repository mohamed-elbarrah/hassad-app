import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCampaignDto, CreateKpiSnapshotDto, CreateAbTestDto } from '../dto/marketing.dto';
import { CampaignStatus, AbTestStatus } from '@hassad/shared';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async createCampaign(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: CampaignStatus.PLANNING,
      },
    });
  }

  async findCampaign(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        client: true,
        manager: true,
        kpiSnapshots: true,
        abTests: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async updateCampaignStatus(id: string, status: CampaignStatus) {
    return this.prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  async addKpiSnapshot(id: string, userId: string, dto: CreateKpiSnapshotDto) {
    // Basic CAC/CTR calculation logic
    const ctr = dto.impressions > 0 ? (dto.clicks / dto.impressions) * 100 : 0;
    const conversionRate = dto.clicks > 0 ? (dto.leadsCount / dto.clicks) * 100 : 0;

    return this.prisma.campaignKpiSnapshot.create({
      data: {
        campaignId: id,
        recordedBy: userId,
        ...dto,
        snapshotDate: new Date(dto.snapshotDate),
        ctr,
        conversionRate,
      },
    });
  }

  async getKpiSnapshots(id: string) {
    return this.prisma.campaignKpiSnapshot.findMany({
      where: { campaignId: id },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  async createAbTest(id: string, userId: string, dto: CreateAbTestDto) {
    return this.prisma.abTest.create({
      data: {
        campaignId: id,
        createdBy: userId,
        ...dto,
        status: AbTestStatus.ACTIVE,
        startedAt: new Date(),
      },
    });
  }

  async stopAbTest(id: string, winningVariantId?: string) {
    return this.prisma.abTest.update({
      where: { id },
      data: {
        status: AbTestStatus.COMPLETED,
        endedAt: new Date(),
        winningVariantId,
      },
    });
  }
}
