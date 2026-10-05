import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { MarketingStrategyStatus } from "@hassad/shared";

@Injectable()
export class AdminMarketingService {
  constructor(private readonly prisma: PrismaService) {}

  private async audit(
    action: string,
    entity: string,
    entityId: string,
    userId?: string,
    before?: any,
    after?: any,
  ) {
    await this.prisma.ledger.create({
      data: { action, entity, entityId, userId, before, after },
    });
  }

  async getStrategies(query: {
    clientId?: string;
    projectId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.marketingStrategy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: { select: { companyName: true } },
          project: { select: { name: true } },
          approver: { select: { id: true, name: true } },
        },
      }),
      this.prisma.marketingStrategy.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStrategyStatus(
    id: string,
    status: string,
    userId: string,
    note?: string,
  ) {
    const strategy = await this.prisma.marketingStrategy.findUnique({
      where: { id },
    });
    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }

    const validStatuses = Object.values(MarketingStrategyStatus) as string[];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status },
      });
    }

    // Strategy transitions must go through the Marketing/PM/Portal workflow
    // services so task review state, history, visibility, and notifications
    // remain synchronized. This legacy admin mutation is intentionally blocked.
    throw new BadRequestException({
      code: "MARKETING_STRATEGY_WORKFLOW_REQUIRED",
      details: { status },
    });
  }
}
