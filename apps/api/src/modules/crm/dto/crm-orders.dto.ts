import { IsIn, IsOptional, IsString } from "class-validator";

export const CRM_ORDER_STAGE_VALUES = [
  "NEW",
  "SCHEDULED",
  "DONE",
  "SENT",
  "NEGOTIATION",
  "APPROVED",
  "CONTRACT_SENT",
  "SIGNED",
  "ACTIVE",
  "CANCELLED",
] as const;

export type CrmOrderStage = (typeof CRM_ORDER_STAGE_VALUES)[number];

export class UpdateCrmOrderStageDto {
  @IsIn(CRM_ORDER_STAGE_VALUES)
  toStage!: CrmOrderStage;

  @IsOptional()
  @IsString()
  note?: string;
}
