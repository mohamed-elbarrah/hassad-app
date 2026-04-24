import {
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  MinLength,
} from "class-validator";

export class SignContractDto {
  @IsString()
  @MinLength(2)
  signedByName: string;

  @IsOptional()
  @IsEmail()
  signedByEmail?: string;

  @IsOptional()
  @IsUrl({}, { message: "signatureUrl must be a valid URL" })
  signatureUrl?: string;
}
