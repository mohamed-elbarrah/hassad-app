import { IsString, IsOptional } from "class-validator";

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
}
