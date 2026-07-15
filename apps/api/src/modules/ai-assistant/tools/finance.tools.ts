import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";
import { AiAssistantArea } from "@hassad/shared";

@Injectable()
export class GetRevenueSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getRevenueSummary",
    description: "ملخص الإيرادات (الشهر الحالي)",
    category: AiAssistantArea.FINANCE,
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

    const payments = await this.prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        createdAt: { gte: startOfMonth },
      },
    });

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      summary: `إجمالي الإيرادات هذا الشهر: ${total.toLocaleString("ar-SA")}`,
      data: { totalRevenue: total, paymentCount: payments.length },
    };
  }
}

@Injectable()
export class GetInvoiceStatusTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getInvoiceStatus",
    description: "حالة الفواتير (مدفوعة، معلقة، متأخرة)",
    category: AiAssistantArea.FINANCE,
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
    const [paid, pending, overdue] = await Promise.all([
      this.prisma.invoice.count({ where: { status: "PAID" } }),
      this.prisma.invoice.count({ where: { status: "DUE" } }),
      this.prisma.invoice.count({
        where: { status: "DUE", dueDate: { lt: now } },
      }),
    ]);

    return {
      summary: `الفواتير: ${paid} مدفوعة، ${pending} معلقة (منها ${overdue} متأخرة)`,
      data: { paid, pending, overdue },
    };
  }
}

@Injectable()
export class GetPendingPaymentsTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getPendingPayments",
    description: "المدفوعات المعلقة",
    category: AiAssistantArea.FINANCE,
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
    const payments = await this.prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, amount: true, method: true, createdAt: true },
    });

    return {
      summary: `${payments.length} مدفوعات معلقة`,
      data: { payments },
    };
  }
}
