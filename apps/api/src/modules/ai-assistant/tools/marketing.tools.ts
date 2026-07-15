import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";

@Injectable()
export class GetCampaignSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getCampaignSummary",
    description: "ملخص الحملات الإعلانية حسب الحالة",
    category: AiAssistantArea.MARKETING,
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  };

  constructor(private prisma: PrismaService) {
    super();
  }

  async execute(): Promise<ToolResult> {
    const [total, byStatus] = await Promise.all([
      this.prisma.campaign.count({ where: { isArchived: false } }),
      this.prisma.campaign.groupBy({
        by: ["status"],
        _count: true,
        where: { isArchived: false },
      }),
    ]);

    return {
      summary: `إجمالي الحملات: ${total}`,
      data: {
        total,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      },
    };
  }
}

@Injectable()
export class GetCampaignPerformanceTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getCampaignPerformance",
    description: "أداء الحملات (إجمالي الإنفاق، مرات الظهور، النقرات)",
    category: AiAssistantArea.MARKETING,
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  };

  constructor(private prisma: PrismaService) {
    super();
  }

  async execute(): Promise<ToolResult> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { isArchived: false },
      select: { name: true, budgetTotal: true, budgetSpent: true },
    });

    const totalBudget = campaigns.reduce((s, c) => s + Number(c.budgetTotal), 0);
    const totalSpent = campaigns.reduce((s, c) => s + Number(c.budgetSpent), 0);

    return {
      summary: `إجمالي ميزانية الحملات: ${totalBudget.toLocaleString("ar-SA")}، المصروف: ${totalSpent.toLocaleString("ar-SA")}`,
      data: { totalBudget, totalSpent, campaignCount: campaigns.length },
    };
  }
}
