import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";
import { formatPlainNumber } from "../../../common/presentation/plain-number";

@Injectable()
export class GetClientSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getClientSummary",
    description: "Client totals (active and new)",
    category: AiAssistantArea.CLIENTS,
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, active, newThisMonth] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.client.count({ where: { status: "ACTIVE" } }),
      this.prisma.client.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return {
      summary: `Total clients: ${formatPlainNumber(total)} (${formatPlainNumber(active)} active, ${formatPlainNumber(newThisMonth)} new this month)`,
      data: { total, active, newThisMonth },
    };
  }
}

@Injectable()
export class GetClientStatusDistributionTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getClientStatusDistribution",
    description: "Client distribution by status",
    category: AiAssistantArea.CLIENTS,
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
    const byStatus = await this.prisma.client.groupBy({
      by: ["status"],
      _count: true,
    });

    return {
      summary: "Client distribution by status",
      data: {
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      },
    };
  }
}
