import {
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ContractType, PaymentAmountType } from "@hassad/shared";
import { PaymentPlanRowDto } from "./payment-plan.dto";

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

export class CreateContractDto {
  @IsUUID()
  requestId: string;

  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @IsString()
  title: string;

  @IsEnum(ContractType)
  type: ContractType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  /** Sent as multipart text; @Transform converts to number */
  @IsOptional()
  @Transform(({ value }) => strictNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  monthlyValue?: number;

  @IsOptional()
  @Transform(({ value }) => strictNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  totalValue?: number;

  // ── Billing plan (Phase 1: down-payment activation gate) ─────────────────────
  /** How the down payment is expressed. Required when a down payment is requested. */
  @IsOptional()
  @IsEnum(PaymentAmountType)
  downPaymentType?: PaymentAmountType;

  /** Down payment value: percentage (0-100) when PERCENT, SAR amount when FIXED. */
  @IsOptional()
  @Transform(({ value }) => strictNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  downPaymentValue?: number;

  /** Bounded retainer length in months (null/omitted = indefinite rolling retainer). */
  @IsOptional()
  @Transform(({ value }) => strictInteger(value))
  @IsInt()
  @Min(1)
  numberOfMonths?: number;

  /** Optional full payment plan defined at creation. Sales may also set it later. */
  @IsOptional()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentPlanRowDto)
  paymentPlan?: PaymentPlanRowDto[];
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => strictNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  monthlyValue?: number;

  @IsOptional()
  @Transform(({ value }) => strictNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  totalValue?: number;

  @IsOptional()
  @IsString()
  filePath?: string;
}

/** Used by authenticated SALES to sign a specific contract by ID */
export class SignContractDto {
  @IsString()
  signedByName: string;

  @IsOptional()
  @IsString()
  signedByEmail?: string;

  @IsOptional()
  @IsString()
  signatureUrl?: string;
}

/** Used by the CLIENT via the public share link */
export class SignByTokenDto {
  @IsString()
  signedByName: string;

  @IsOptional()
  @IsString()
  signedByEmail?: string;
}

export class CreateVersionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
