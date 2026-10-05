import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MarketingStrategyStatus } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import { MarketingStrategyService } from "../../marketing/services/marketing-strategy.service";

@Injectable()
export class PmMarketingStrategiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strategies: MarketingStrategyService,
  ) {}

  async byTask(userId: string, taskId: string) {
    const strategy = await this.prisma.marketingStrategy.findFirst({
      where: {
        taskId,
        status: { not: MarketingStrategyStatus.DRAFT },
        task: { project: { projectManagerId: userId } },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    return strategy ? this.detail(userId, strategy.id) : null;
  }

  async detail(userId: string, id: string) {
    const strategy = await this.ownedStrategy(userId, id);
    return this.strategies.findOne(strategy.id);
  }

  async download(userId: string, id: string) {
    const strategy = await this.ownedStrategy(userId, id);
    return { url: await this.strategies.getDownloadUrl(strategy.id) };
  }

  async approveForClient(userId: string, id: string) {
    await this.assertStatus(userId, id, MarketingStrategyStatus.PM_REVIEW);
    return this.strategies.approveForClient(id, userId);
  }

  async requestRevision(userId: string, id: string, comment: string) {
    await this.assertStatus(userId, id, MarketingStrategyStatus.PM_REVIEW);
    return this.strategies.requestPmRevision(id, userId, comment);
  }

  private async ownedStrategy(userId: string, id: string) {
    const strategy = await this.prisma.marketingStrategy.findFirst({
      where: {
        id,
        status: { not: MarketingStrategyStatus.DRAFT },
        task: { project: { projectManagerId: userId } },
      },
      select: { id: true, status: true },
    });
    if (!strategy) {
      throw new NotFoundException({
        code: "MARKETING_STRATEGY_NOT_FOUND",
        details: {},
      });
    }
    return strategy;
  }

  private async assertStatus(
    userId: string,
    id: string,
    expected: MarketingStrategyStatus,
  ) {
    const strategy = await this.ownedStrategy(userId, id);
    if (strategy.status !== expected) {
      throw new BadRequestException({
        code: "MARKETING_STRATEGY_INVALID_STATUS",
        details: { status: strategy.status },
      });
    }
  }
}
