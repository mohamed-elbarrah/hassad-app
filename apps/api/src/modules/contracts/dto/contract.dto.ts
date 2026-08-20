import {
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  IsInt,
  IsIn,
  Min,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ContractType, PaymentAmountType } from "@hassad/shared";
import { PaymentPlanRowDto } from "./payment-plan.dto";

export class CreateContractDto {
  @IsUUID()
  requestId: string;

  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @IsString()
  title: string;

  @IsIn([ContractType.FIXED_PROJECT, ContractType.MONTHLY_RETAINER])
  type: ContractType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  /** Sent as multipart text; @Transform converts to number */
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  monthlyValue?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  totalValue?: number;

  // ── Billing plan (Phase 1: down-payment activation gate) ─────────────────────
  /** How the down payment is expressed. Required when a down payment is requested. */
  @IsOptional()
  @IsEnum(PaymentAmountType)
  downPaymentType?: PaymentAmountType;

  /** Down payment value: percentage (0-100) when PERCENT, SAR amount when FIXED. */
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  downPaymentValue?: number;

  /** Bounded retainer length in months (null/omitted = indefinite rolling retainer). */
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
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
  @IsNumber()
  monthlyValue?: number;

  @IsOptional()
  @IsNumber()
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
