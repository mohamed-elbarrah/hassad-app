import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AiAnalyzeDto } from "../dto/ai.dto";
import { AiProviderRegistry } from "./ai-provider-registry.service";
import { AiSuggestionStatus } from "@hassad/shared";
import { AiProviderError, classifyProviderError } from "../adapters/provider.interface";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private registry: AiProviderRegistry,
  ) {}

  async analyze(userId: string, dto: AiAnalyzeDto) {
    const inputData = {
      entityType: dto.entityType,
      entityId: dto.entityId,
      analysisType: dto.analysisType,
    };
    const prompt = this.buildPrompt(dto);

    let result: { summary: string; score: number; recommendations?: string[] };
    try {
      const aiResult = await this.registry.generateWithFallback(prompt);
      result = this.parseResponse(aiResult.text);
    } catch (err) {
      const error = classifyProviderError(err);
      this.logger.warn(`AI analysis failed (${error.code})`);
      throw new AiProviderError(error.code, { status: error.status, retryable: error.retryable });
    }

    return this.prisma.aiAnalysisLog.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        analysisType: dto.analysisType,
        triggeredBy: userId,
        inputData,
        outputData: result,
        confidenceScore: result.score,
      },
    });
  }

  private buildPrompt(dto: AiAnalyzeDto): string {
    const typeLabels: Record<string, string> = {
      CHURN_PREDICTION: "توقع انسحاب العميل",
      SENTIMENT_ANALYSIS: "تحليل المشاعر",
      PERFORMANCE_FORECAST: "توقع الأداء",
      CONTENT_GENERATION: "توليد محتوى",
      QUALITY_CHECK: "فحص الجودة",
    };

    return (
      `أنت مساعد تحليلي لمنصة حسد لإدارة الأعمال. قم بـ "${typeLabels[dto.analysisType] || dto.analysisType}" ` +
      `للكيان "${dto.entityType}" بالمعرف "${dto.entityId}".\n\n` +
      `الرد يجب أن يكون بصيغة JSON فقط (بدون علامات markdown أو أكواد):\n` +
      `{\n  "summary": "ملخص التحليل بالعربية",\n  "score": 0-100,\n  "recommendations": ["توصية 1", "توصية 2"]\n}\n\n` +
      `ملاحظات:\n` +
      `- score: رقم بين 0 و 100 يمثل الثقة/الدرجة\n` +
      `- summary: نص وصفي بالعربية\n` +
      `- recommendations: مصفوفة من النصوص`
    );
  }

  private parseResponse(text: string): {
    summary: string;
    score: number;
    recommendations?: string[];
  } {
    try {
      const cleaned = text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      return {
        summary: parsed.summary || "تحليل آلي",
        score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
      };
    } catch {
      return {
        summary: text.slice(0, 500),
        score: 50,
        recommendations: [],
      };
    }
  }

  async getLog(id: string) {
    const log = await this.prisma.aiAnalysisLog.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!log) {
      throw new NotFoundException({ code: "AI_ANALYSIS_LOG_NOT_FOUND", details: { id } });
    }

    return log;
  }

  async getSuggestions() {
    return this.prisma.aiSuggestion.findMany({
      where: { status: AiSuggestionStatus.PENDING },
      include: { actor: true },
    });
  }

  async updateSuggestionStatus(
    id: string,
    userId: string,
    status: AiSuggestionStatus,
  ) {
    return this.prisma.aiSuggestion.update({
      where: { id },
      data: {
        status,
        actionedBy: userId,
        actionedAt: new Date(),
      },
    });
  }
}
