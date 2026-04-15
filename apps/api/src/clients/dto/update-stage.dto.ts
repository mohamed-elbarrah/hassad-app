import { IsEnum } from 'class-validator';
import { PipelineStage } from '@hassad/shared';

/**
 * UpdateStageDto — the body for PATCH /clients/:id/stage.
 * Validates that only a recognised PipelineStage value is provided.
 * Business-rule validation (allowed transitions) is enforced in ClientsService.
 */
export class UpdateStageDto {
  @IsEnum(PipelineStage, { message: 'stage must be a valid PipelineStage' })
  stage: PipelineStage;
}
