import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";
import { formatPlainNumber } from "../../../common/presentation/plain-number";

@Injectable()
export class GetRequestPipelineSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRequestPipelineSummary",
    description: "Request totals by stage",
    category: AiAssistantArea.CRM,
    parameters: { type: "object", properties: {}, required: [] },
  };

  constructor(private prisma: PrismaService) { super(); }

  async execute(): Promise<ToolResult> {
    const total = await this.prisma.request.count();
    const byStage = await this.prisma.request.groupBy({ by: ["status"], _count: true });
    return {
      summary: `Total requests: ${formatPlainNumber(total)}`,
      data: { total, byStage: byStage.map((s) => ({ stage: s.status, count: s._count })) },
    };
  }
}

@Injectable()
export class GetRequestStatusDistributionTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRequestPipelineDistribution",
    description: "Request distribution by stage",
    category: AiAssistantArea.CRM,
    parameters: { type: "object", properties: {}, required: [] },
  };

  constructor(private prisma: PrismaService) { super(); }

  async execute(): Promise<ToolResult> {
    const byStage = await this.prisma.request.groupBy({ by: ["status"], _count: true });
    return {
      summary: "Request distribution by stage",
      data: { byStage: byStage.map((s) => ({ stage: s.status, count: s._count })) },
    };
  }
}

@Injectable()
export class GetRecentRequestsTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRecentRequests",
    description: "Most recently added requests",
    category: AiAssistantArea.CRM,
    parameters: {
      type: "object",
      properties: { limit: { type: "number", description: "Result count (maximum 20)" } },
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
      summary: `${formatPlainNumber(requests.length)} most recent requests`,
      data: { requests },
    };
  }
}
