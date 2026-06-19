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
import { Type } from "class-transformer";
import {
  PaymentPlanTriggerType,
  PaymentAmountType,
} from "@hassad/shared";

/** A single planned payment row on a contract's payment plan. */
export class PaymentPlanRowDto {
  @IsOptional()
  @IsString()
  id?: string; // present when updating an existing row

  @IsString()
  label: string;

  @IsOptional()
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
  @IsNumber()
  @Min(0)
  amountValue: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @IsOptional()
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