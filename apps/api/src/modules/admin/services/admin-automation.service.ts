import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminAutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.requestAutomationRule.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { logs: true } } },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.requestAutomationRule.findUnique({
      where: { id },
      include: { logs: { orderBy: { executedAt: "desc" }, take: 20 } },
    });
    if (!rule) throw new NotFoundException("Automation rule not found");
    return rule;
  }

  async create(data: {
    name: string;
    triggerType: string;
    conditionJson: unknown;
    actionJson: unknown;
  }) {
    return this.prisma.requestAutomationRule.create({
      data: {
        name: data.name,
        triggerType: data.triggerType,
        conditionJson: data.conditionJson as object,
        actionJson: data.actionJson as object,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      triggerType?: string;
      conditionJson?: unknown;
      actionJson?: unknown;
      isActive?: boolean;
    },
  ) {
    const rule = await this.prisma.requestAutomationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException("Automation rule not found");
    return this.prisma.requestAutomationRule.update({
      where: { id },
      data: {
        ...data,
        conditionJson: data.conditionJson as object | undefined,
        actionJson: data.actionJson as object | undefined,
      },
    });
  }

  async remove(id: string) {
    const rule = await this.prisma.requestAutomationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException("Automation rule not found");
    return this.prisma.requestAutomationRule.delete({ where: { id } });
  }

  async getLogs(ruleId?: string) {
    return this.prisma.requestAutomationLog.findMany({
      where: ruleId ? { ruleId } : undefined,
      orderBy: { executedAt: "desc" },
      take: 50,
      include: {
        request: { select: { id: true, companyName: true } },
        rule: { select: { id: true, name: true } },
      },
    });
  }
}
