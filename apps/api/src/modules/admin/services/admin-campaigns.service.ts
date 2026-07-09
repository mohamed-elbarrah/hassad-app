import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminCreateCampaignDto, AdminUpdateCampaignDto } from "../dto/admin-campaign.dto";

@Injectable()
export class AdminCampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: AdminCreateCampaignDto, userId: string) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        platform: dto.platform,
        budgetTotal: dto.budgetTotal,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        clientId: dto.clientId,
        managedBy: userId,
        taskId: dto.taskId ?? null,
      },
    });
    return campaign;
  }

  async findAll(query: any) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        {
          client: {
            companyName: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }
    if (query.clientId) where.clientId = query.clientId;
    if (query.managedById) where.managedBy = query.managedById;
    if (query.platform) where.platform = query.platform;
    if (query.status) where.status = query.status;
    if (query.overspentOnly === "true") {
      where.budgetSpent = { gt: 0 };
      // We'll filter in-memory since we need to compare budgetSpent > budgetTotal
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    let [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    // Apply overspent filter in-memory
    if (query.overspentOnly === "true") {
      items = items.filter(
        (c) => Number(c.budgetSpent) > Number(c.budgetTotal),
      );
      total = items.length;
    }

    return {
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        clientName: c.client?.companyName ?? "—",
        managedById: c.managedBy ?? null,
        managedByName: c.manager?.name ?? "—",
        platform: c.platform,
        status: c.status,
        budgetTotal: c.budgetTotal,
        budgetSpent: c.budgetSpent,
        isOverspent: Number(c.budgetSpent) > Number(c.budgetTotal),
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, companyName: true } },
        manager: { select: { id: true, name: true, email: true } },
        kpiSnapshots: { orderBy: { recordedAt: "desc" }, take: 20 },
        statusHistory: { orderBy: { createdAt: "desc" } },
        platformConnections: true,
        task: {
          include: {
            assignee: { select: { id: true, name: true } },
            marketingStrategies: {
              select: {
                id: true,
                status: true,
                fileName: true,
                filePath: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");
    return campaign;
  }

  async update(id: string, dto: AdminUpdateCampaignDto, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException("Campaign not found");

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

    await this.prisma.ledger.create({
      data: {
        action: "admin.campaigns.update",
        entity: "campaign",
        entityId: id,
        userId,
        before: { name: campaign.name, platform: campaign.platform, budgetTotal: campaign.budgetTotal },
        after: data,
      },
    });

    return updated;
  }

  async pause(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "PAUSED" as any },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.campaigns.pause",
          entity: "campaign",
          entityId: campaignId,
        },
      }),
    ]);
    return { success: true };
  }

  async end(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");

    await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "ENDED" as any },
      }),
      this.prisma.ledger.create({
        data: {
          action: "admin.campaigns.end",
          entity: "campaign",
          entityId: campaignId,
        },
      }),
    ]);
    return { success: true };
  }
}
