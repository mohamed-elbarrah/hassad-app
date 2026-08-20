import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

function parseArray(value: unknown) {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [value];
    }
  }
  return value;
}

export class CrmContractsWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["all", "sent", "signed", "active", "on-hold", "expired", "cancelled"])
  status?: "all" | "sent" | "signed" | "active" | "on-hold" | "expired" | "cancelled";

  @IsOptional()
  @IsString()
  @IsIn(["FIXED_PROJECT", "MONTHLY_RETAINER"])
  type?: string;

  @IsOptional()
  @IsString()
  expiringDays?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class CrmContractPaymentPlanDto {
  @IsString()
  label!: string;

  @IsString()
  triggerType!: string;

  @IsString()
  amountType!: string;

  @Type(() => Number)
  @IsNumber()
  amountValue!: number;

  @IsOptional()
  @Type(() => Boolean)
  isRecurring?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dueOffsetDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sequence?: number;
}

export class CrmCreateContractDto {
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @IsOptional()
  @IsUUID()
  proposalId?: string;

  @IsString()
  title!: string;

  @IsString()
  @IsIn(["FIXED_PROJECT", "MONTHLY_RETAINER"])
  type!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsString()
  downPaymentType?: string;

  @IsOptional()
  @Type(() => Boolean)
  initialPaymentRequired?: boolean;

  @IsOptional()
  @IsIn(["PERCENT", "FIXED"])
  initialPaymentType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  initialPaymentValue?: number;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  downPaymentValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numberOfMonths?: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseArray(value))
  @Type(() => CrmContractPaymentPlanDto)
  paymentPlan?: CrmContractPaymentPlanDto[];
}

export class CrmUpdateContractDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlyValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsString()
  downPaymentType?: string;

  @IsOptional()
  @Type(() => Boolean)
  initialPaymentRequired?: boolean;

  @IsOptional()
  @IsIn(["PERCENT", "FIXED"])
  initialPaymentType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  initialPaymentValue?: number;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  downPaymentValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  numberOfMonths?: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => parseArray(value))
  @Type(() => CrmContractPaymentPlanDto)
  paymentPlan?: CrmContractPaymentPlanDto[];
}
