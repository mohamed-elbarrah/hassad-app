import { IsString, IsOptional, IsBoolean, IsObject, IsUUID } from 'class-validator';

export class CreateAutomationRuleDto {
  @IsString()
  name: string;

  @IsString()
  triggerType: string;

  @IsObject()
  conditionJson: Record<string, unknown>;

  @IsObject()
  actionJson: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ExecuteAutomationDto {
  @IsUUID()
  ruleId: string;

  @IsUUID()
  leadId: string;
}
