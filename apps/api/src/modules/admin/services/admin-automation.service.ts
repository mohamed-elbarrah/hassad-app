import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminAutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.leadAutomationRule.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { logs: true } } },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.leadAutomationRule.findUnique({
      where: { id },
      include: { logs: { orderBy: { executedAt: "desc" }, take: 20 } },
    });
    if (!rule) throw new NotFoundException("القاعدة غير موجودة");
    return rule;
  }

  async create(data: { name: string; triggerType: string; conditionJson: any; actionJson: any }) {
    return this.prisma.leadAutomationRule.create({
      data: { name: data.name, triggerType: data.triggerType, conditionJson: data.conditionJson, actionJson: data.actionJson },
    });
  }

  async update(id: string, data: { name?: string; triggerType?: string; conditionJson?: any; actionJson?: any; isActive?: boolean }) {
    const rule = await this.prisma.leadAutomationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException("القاعدة غير موجودة");
    return this.prisma.leadAutomationRule.update({ where: { id }, data });
  }

  async remove(id: string) {
    const rule = await this.prisma.leadAutomationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException("القاعدة غير موجودة");
    return this.prisma.leadAutomationRule.delete({ where: { id } });
  }

  async getLogs(ruleId?: string) {
    const where: any = {};
    if (ruleId) where.ruleId = ruleId;
    return this.prisma.leadAutomationLog.findMany({
      where,
      orderBy: { executedAt: "desc" },
      take: 50,
      include: { lead: { select: { id: true, companyName: true } }, rule: { select: { id: true, name: true } } },
    });
  }
}
