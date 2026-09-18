import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreatePaymentIntentDto {
  @IsUUID()
  invoiceId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  gatewayName?: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
