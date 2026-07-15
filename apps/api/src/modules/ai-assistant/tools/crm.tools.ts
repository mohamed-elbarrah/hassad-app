import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";

@Injectable()
export class GetLeadPipelineSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getLeadPipelineSummary",
    description: "إجمالي العملاء المحتملين حسب المرحلة",
    category: AiAssistantArea.CRM,
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
    const total = await this.prisma.lead.count({ where: { isActive: true } });
    const byStage = await this.prisma.lead.groupBy({
      by: ["pipelineStage"],
      _count: true,
      where: { isActive: true },
    });

    return {
      summary: `إجمالي العملاء المحتملين: ${total}`,
      data: {
        total,
        byStage: byStage.map((s) => ({ stage: s.pipelineStage, count: s._count })),
      },
    };
  }
}

@Injectable()
export class GetLeadStatusDistributionTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getLeadPipelineDistribution",
    description: "توزيع العملاء المحتملين حسب مرحلة البيع",
    category: AiAssistantArea.CRM,
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
    const byStage = await this.prisma.lead.groupBy({
      by: ["pipelineStage"],
      _count: true,
      where: { isActive: true },
    });

    return {
      summary: "توزيع العملاء المحتملين حسب المرحلة",
      data: {
        byStage: byStage.map((s) => ({ stage: s.pipelineStage, count: s._count })),
      },
    };
  }
}

@Injectable()
export class GetRecentLeadsTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRecentLeads",
    description: "آخر العملاء المحتملين المضافين",
    category: AiAssistantArea.CRM,
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "عدد النتائج (أقصى 20)" },
      },
      required: [],
    },
  };

  constructor(private prisma: PrismaService) {
    super();
  }

  async execute(args: { limit?: number }): Promise<ToolResult> {
    const limit = Math.min(args.limit ?? 10, 20);
    const leads = await this.prisma.lead.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, companyName: true, pipelineStage: true, createdAt: true },
    });

    return {
      summary: `آخر ${leads.length} عملاء محتملين`,
      data: { leads },
    };
  }
}
