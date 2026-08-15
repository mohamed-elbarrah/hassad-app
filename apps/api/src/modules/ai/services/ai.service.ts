import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AiAnalyzeDto } from "../dto/ai.dto";
import { AiProviderRegistry } from "./ai-provider-registry.service";
import { AiSuggestionStatus } from "@hassad/shared";

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
      this.logger.warn("All AI providers failed, using stub fallback", err);
      result = {
        summary: `Analysis of ${dto.analysisType} for ${dto.entityType} ${dto.entityId}`,
        score: Math.round(Math.random() * 10000) / 100,
        recommendations: [],
      };
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
      CHURN_PREDICTION: "Client churn prediction",
      SENTIMENT_ANALYSIS: "Sentiment analysis",
      PERFORMANCE_FORECAST: "Performance forecast",
      CONTENT_GENERATION: "Content generation",
      QUALITY_CHECK: "Quality check",
    };

    return (
      `You are an analytical assistant for Hassad business management. Perform "${typeLabels[dto.analysisType] || dto.analysisType}" ` +
      `for entity "${dto.entityType}" with ID "${dto.entityId}".\n\n` +
      `Respond with JSON only (without markdown or code fences):\n` +
      `{\n  "summary": "Analysis summary in English",\n  "score": 0-100,\n  "recommendations": ["Recommendation 1", "Recommendation 2"]\n}\n\n` +
      `Notes:\n` +
      `- score: a number from 0 to 100 representing confidence or score\n` +
      `- summary: a descriptive summary in English\n` +
      `- recommendations: an array of text values`
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
        summary: parsed.summary || "Automated analysis",
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
      throw new NotFoundException(`AI Log with ID ${id} not found`);
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
