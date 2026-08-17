import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";

@Injectable()
export class GetRequestPipelineSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRequestPipelineSummary",
    description: "إجمالي الطلبات حسب المرحلة",
    category: AiAssistantArea.CRM,
    parameters: { type: "object", properties: {}, required: [] },
  };

  constructor(private prisma: PrismaService) { super(); }

  async execute(): Promise<ToolResult> {
    const total = await this.prisma.request.count();
    const byStage = await this.prisma.request.groupBy({ by: ["status"], _count: true });
    return {
      summary: `إجمالي الطلبات: ${total}`,
      data: { total, byStage: byStage.map((s) => ({ stage: s.status, count: s._count })) },
    };
  }
}

@Injectable()
export class GetRequestStatusDistributionTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRequestPipelineDistribution",
    description: "توزيع الطلبات حسب المرحلة",
    category: AiAssistantArea.CRM,
    parameters: { type: "object", properties: {}, required: [] },
  };

  constructor(private prisma: PrismaService) { super(); }

  async execute(): Promise<ToolResult> {
    const byStage = await this.prisma.request.groupBy({ by: ["status"], _count: true });
    return {
      summary: "توزيع الطلبات حسب المرحلة",
      data: { byStage: byStage.map((s) => ({ stage: s.status, count: s._count })) },
    };
  }
}

@Injectable()
export class GetRecentRequestsTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRecentRequests",
    description: "آخر الطلبات المضافة",
    category: AiAssistantArea.CRM,
    parameters: {
      type: "object",
      properties: { limit: { type: "number", description: "عدد النتائج (أقصى 20)" } },
      required: [],
    },
  };

  constructor(private prisma: PrismaService) { super(); }

  async execute(args: { limit?: number }): Promise<ToolResult> {
    const limit = Math.min(args.limit ?? 10, 20);
    const requests = await this.prisma.request.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, companyName: true, status: true, createdAt: true },
    });
    return {
      summary: `آخر ${requests.length} طلبات`,
      data: { requests },
    };
  }
}
