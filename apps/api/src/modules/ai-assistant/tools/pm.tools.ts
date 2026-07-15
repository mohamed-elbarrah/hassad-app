import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";

@Injectable()
export class GetProjectSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getProjectSummary",
    description: "إجمالي المشاريع حسب الحالة",
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
      summary: `إجمالي المشاريع: ${total}`,
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
    description: "توزيع المهام حسب الحالة والأولوية",
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
      summary: "توزيع المهام",
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
    description: "المهام ذات المواعيد النهائية القريبة (خلال 7 أيام)",
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
      summary: `${tasks.length} مهمة تقترب من الموعد النهائي خلال 7 أيام`,
      data: { tasks },
    };
  }
}
