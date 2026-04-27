import { IsString, IsEnum, IsUUID, IsJSON, IsOptional } from 'class-validator';
import { AiEntityType, AiAnalysisType } from '@hassad/shared';

export class AiAnalyzeDto {
  @IsEnum(AiEntityType)
  entityType: AiEntityType;

  @IsUUID()
  entityId: string;

  @IsEnum(AiAnalysisType)
  analysisType: AiAnalysisType;
}
