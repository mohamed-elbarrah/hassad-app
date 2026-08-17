import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PaymentPlanTriggerType, PaymentAmountType } from "@hassad/shared";

function strictNumber(value: unknown) {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value !== "string" || value.trim() === "") return value;
  const text = value.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) return Number.NaN;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function strictInteger(value: unknown) {
  if (typeof value === "number")
    return Number.isInteger(value) ? value : Number.NaN;
  if (typeof value !== "string" || value.trim() === "") return value;
  const text = value.trim();
  if (!/^[+-]?\d+$/.test(text)) return Number.NaN;
  return Number(text);
}

/** A single planned payment row on a contract's payment plan. */
export class PaymentPlanRowDto {
  @IsOptional()
  @IsString()
  id?: string; // present when updating an existing row

  @IsString()
  label: string;

  @IsOptional()
  @Transform(({ value }) => strictInteger(value))
  @IsInt()
  @Min(0)
  sequence?: number;

  @IsEnum(PaymentPlanTriggerType)
  triggerType: PaymentPlanTriggerType;

  @IsEnum(PaymentAmountType)
  amountType: PaymentAmountType;

  /**
   * Percentage of `contract.totalValue` (0-100) when `amountType = PERCENT`,
   * or a fixed amount in the contract currency (SAR) when `amountType = FIXED`.
   */
  @Transform(({ value }) => strictNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  amountValue: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => strictInteger(value))
  @IsInt()
  @Min(0)
  dueOffsetDays?: number = 0;
}

/** Replace a contract's entire payment plan. */
export class DefinePaymentPlanDto {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentPlanRowDto)
  rows: PaymentPlanRowDto[];
}
