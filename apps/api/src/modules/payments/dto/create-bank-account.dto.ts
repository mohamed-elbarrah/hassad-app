import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateBankAccountDto {
  @IsString()
  accountName: string;

  @IsString()
  iban: string;

  @IsString()
  bankName: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
