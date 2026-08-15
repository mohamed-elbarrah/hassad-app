import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";
import { formatPlainNumber } from "../../../common/presentation/plain-number";

@Injectable()
export class GetProjectSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getProjectSummary",
    description: "Project totals by status",
    category: AiAssistantArea.PM,
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
      this.prisma.project.count({ where: { isArchived: false } }),
      this.prisma.project.groupBy({
        by: ["status"],
        _count: true,
        where: { isArchived: false },
      }),
    ]);

    return {
      summary: `Total projects: ${formatPlainNumber(total)}`,
      data: {
        total,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      },
    };
  }
}

@Injectable()
export class GetTaskDistributionTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getTaskDistribution",
    description: "Task distribution by status and priority",
    category: AiAssistantArea.PM,
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
    const [byStatus, byPriority] = await Promise.all([
      this.prisma.task.groupBy({
        by: ["status"],
        _count: true,
        where: { archivedAt: null },
      }),
      this.prisma.task.groupBy({
        by: ["priority"],
        _count: true,
        where: { archivedAt: null },
      }),
    ]);

    return {
      summary: "Task distribution",
      data: {
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
      },
    };
  }
}

@Injectable()
export class GetUpcomingDeadlinesTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getUpcomingDeadlines",
    description: "Tasks with upcoming deadlines (within 7 days)",
    category: AiAssistantArea.PM,
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
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        archivedAt: null,
        status: { not: "DONE" },
        dueDate: { gte: now, lte: weekFromNow },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
      select: { id: true, title: true, dueDate: true, priority: true },
    });

    return {
      summary: `${formatPlainNumber(tasks.length)} tasks are due within 7 days`,
      data: { tasks },
    };
  }
}
