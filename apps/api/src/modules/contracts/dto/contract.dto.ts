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
  @Min(0.01)
  totalValue?: number;

  // ── Billing plan (Phase 1: down-payment activation gate) ─────────────────────
  /** How the down payment is expressed. Required when a down payment is requested. */
  @IsOptional()
  @IsEnum(PaymentAmountType)
  downPaymentType?: PaymentAmountType;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsIn([true, false])
  initialPaymentRequired?: boolean;

  @IsOptional()
  @IsEnum(PaymentAmountType)
  initialPaymentType?: PaymentAmountType;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  initialPaymentValue?: number;

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
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  monthlyValue?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.01)
  totalValue?: number;
}

/** Sales-owned contract edit fields. The PDF is uploaded separately as `file`;
 * storage keys and server-controlled payment status are deliberately not accepted.
 */
export class SalesUpdateContractDto extends UpdateContractDto {
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  numberOfMonths?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsIn([true, false])
  initialPaymentRequired?: boolean;

  /** Preferred names used by the Sales form. */
  @IsOptional()
  @IsEnum(PaymentAmountType)
  initialPaymentType?: PaymentAmountType;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  initialPaymentValue?: number;

  /** Backwards-compatible aliases used by contract creation. */
  @IsOptional()
  @IsEnum(PaymentAmountType)
  downPaymentType?: PaymentAmountType;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  downPaymentValue?: number;
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
