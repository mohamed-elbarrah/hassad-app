import { BadRequestException, Injectable } from "@nestjs/common";
import { AiAssistantArea } from "@hassad/shared";
import { SemanticIntelligenceService, MAX_RESULTS } from "../../semantic-intelligence/semantic-intelligence.service";
import { BaseTool, ToolDefinition, ToolResult } from "./tool.interface";

const periodParameter = (description: string): ToolDefinition["parameters"]["properties"][string] => ({
  type: "object",
  description,
  properties: {
    from: { type: "string", description: "بداية الفترة ISO أو YYYY-MM-DD، بتوقيت UTC" },
    to: { type: "string", description: "نهاية الفترة الحصرية ISO أو YYYY-MM-DD، بتوقيت UTC" },
  },
  required: ["from", "to"],
});

function objectArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new BadRequestException({ code: "SEMANTIC_ARGUMENTS_INVALID", details: {} });
  }
  return args;
}

@Injectable()
export class GetBusinessOverviewTool extends BaseTool {
  definition: ToolDefinition = {
    name: "getBusinessOverview",
    description: "بيانات تشغيلية موثقة لفترة محددة: الطلبات والعملاء والمشاريع والمهام والمدفوعات والفواتير والحملات. لا تمثل الإيرادات أو التحويلات.",
    category: AiAssistantArea.ALL,
    parameters: {
      type: "object",
      properties: { period: periodParameter("الفترة الزمنية المطلوبة"), maxResults: { type: "number", description: "حد النتائج، من 1 إلى 100" } },
      required: ["period"],
    },
  };

  constructor(private readonly semantic: SemanticIntelligenceService) { super(); }

  async execute(args?: Record<string, unknown>): Promise<ToolResult> {
    const input = objectArgs(args);
    const period = this.semantic.parsePeriod(input.period, "period");
    const requested = input.maxResults === undefined ? MAX_RESULTS : input.maxResults;
    if (typeof requested !== "number" || !Number.isInteger(requested) || requested < 1 || requested > MAX_RESULTS) {
      throw new BadRequestException({ code: "SEMANTIC_MAX_RESULTS_INVALID", details: { max: MAX_RESULTS } });
    }
    const overview = await this.semantic.getBusinessOverview(period, requested);
    return { summary: "BUSINESS_OVERVIEW", data: overview };
  }
}

@Injectable()
export class CompareBusinessPeriodsTool extends BaseTool {
  definition: ToolDefinition = {
    name: "compareBusinessPeriods",
    description: "مقارنة مؤشرات تشغيلية حقيقية بين فترتين؛ النسبة غير متاحة عندما تكون قيمة الفترة السابقة صفراً.",
    category: AiAssistantArea.ALL,
    parameters: {
      type: "object",
      properties: { current: periodParameter("الفترة الحالية"), previous: periodParameter("الفترة السابقة") },
      required: ["current", "previous"],
    },
  };

  constructor(private readonly semantic: SemanticIntelligenceService) { super(); }

  async execute(args?: Record<string, unknown>): Promise<ToolResult> {
    const input = objectArgs(args);
    const current = this.semantic.parsePeriod(input.current, "current");
    const previous = this.semantic.parsePeriod(input.previous, "previous");
    if (current.to.getTime() - current.from.getTime() !== previous.to.getTime() - previous.from.getTime()) {
      throw new BadRequestException({ code: "SEMANTIC_COMPARISON_PERIODS_MISMATCH", details: { reasonCode: "PERIOD_DURATIONS_MUST_MATCH" } });
    }
    const [now, then] = await Promise.all([
      this.semantic.getBusinessOverview(current),
      this.semantic.getBusinessOverview(previous),
    ]);
    const a = now.metrics;
    const b = then.metrics;
    const scalar = (key: string, currentValue: number, previousValue: number) => ({ metric: key, ...SemanticIntelligenceService.compare(currentValue, previousValue) });
    return {
      summary: "BUSINESS_PERIOD_COMPARISON",
      data: {
        currentPeriod: now.period,
        previousPeriod: then.period,
        metrics: [
          scalar("requestsCreated", a.crm.requestsCreated, b.crm.requestsCreated),
          scalar("clientsCreated", a.clients.clientsCreated, b.clients.clientsCreated),
          scalar("projectsCreated", a.projects.projectsCreated, b.projects.projectsCreated),
          scalar("tasksCreated", a.tasks.tasksCreated, b.tasks.tasksCreated),
          scalar("successfulPayments", a.finance.successfulPayments, b.finance.successfulPayments),
          scalar("invoicesIssued", a.finance.invoicesIssued, b.finance.invoicesIssued),
          scalar("campaignsCreated", a.marketing.campaignsCreated, b.marketing.campaignsCreated),
        ],
        metadata: comparisonMetadata(now, then),
      },
    };
  }
}

function comparisonMetadata(current: { metadata?: Record<string, unknown> }, previous: { metadata?: Record<string, unknown> }) {
  const policies = [current.metadata?.currencyPolicy, previous.metadata?.currencyPolicy].filter(Boolean) as Array<{ currencies?: string[] }>;
  const currencies = [...new Set(policies.flatMap((policy) => policy.currencies ?? []))].sort();
  return metadata(currencies);
}

function metadata(currencies: string[] = []) {
  const now = new Date().toISOString();
  return {
    source: "Prisma operational database aggregates",
    freshness: { asOf: now, kind: "query_time" },
    generatedAt: now,
    currencyPolicy: { mode: "GROUP_BY_CURRENCY", conversion: "NONE", monetaryComparison: "NOT_INCLUDED", mixedCurrency: currencies.length > 1, currencies },
  };
}
