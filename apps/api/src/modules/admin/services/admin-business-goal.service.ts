import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateBusinessGoalDto, UpdateBusinessGoalDto } from "../dto/admin-business-goal.dto";

@Injectable()
export class AdminBusinessGoalService {
  constructor(private prisma: PrismaService) {}

  async findAll(metric?: string) {
    const where = metric ? { metric } : {};
    return this.prisma.businessGoal.findMany({
      where,
      orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
    });
  }

  async findOne(id: string) {
    const goal = await this.prisma.businessGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException("Business goal not found");
    return goal;
  }

  async create(dto: CreateBusinessGoalDto) {
    return this.prisma.businessGoal.create({
      data: {
        metric: dto.metric,
        target: dto.target,
        current: dto.current ?? 0,
        period: dto.period ?? "monthly",
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
    });
  }

  async update(id: string, dto: UpdateBusinessGoalDto) {
    await this.findOne(id);
    return this.prisma.businessGoal.update({
      where: { id },
      data: {
        ...(dto.metric !== undefined && { metric: dto.metric }),
        ...(dto.target !== undefined && { target: dto.target }),
        ...(dto.current !== undefined && { current: dto.current }),
        ...(dto.period !== undefined && { period: dto.period }),
        ...(dto.periodStart !== undefined && { periodStart: new Date(dto.periodStart) }),
        ...(dto.periodEnd !== undefined && { periodEnd: new Date(dto.periodEnd) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.businessGoal.delete({ where: { id } });
  }
}
