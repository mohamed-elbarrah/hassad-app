import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiAnalyzeDto } from '../dto/ai.dto';
import { AiSuggestionStatus } from '@hassad/shared';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async analyze(userId: string, dto: AiAnalyzeDto) {
    // Placeholder for AI logic
    const result = {
      summary: `AI Analysis for ${dto.entityType} ${dto.entityId}`,
      score: Math.random() * 100,
      timestamp: new Date().toISOString(),
    };

    return this.prisma.aiAnalysisLog.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        analysisType: dto.analysisType,
        triggeredBy: userId,
        inputData: {}, // Map to schema
        outputData: result,
        confidenceScore: result.score || 100,
      },
    });
  }

  async getLog(id: string) {
    const log = await this.prisma.aiAnalysisLog.findUnique({
      where: { id },
      include: {
        user: true, // Relation name in schema
      },
    });

    if (!log) {
      throw new NotFoundException(`AI Log with ID ${id} not found`);
    }

    return log;
  }

  async getSuggestions() {
    return this.prisma.aiSuggestion.findMany({
      where: { status: AiSuggestionStatus.PENDING },
      include: {
        actor: true, // Relation name in schema
      },
    });
  }

  async updateSuggestionStatus(id: string, userId: string, status: AiSuggestionStatus) {
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
