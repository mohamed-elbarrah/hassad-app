import { IsString, IsEmail, IsEnum, MinLength } from "class-validator";
import { BusinessType } from "@hassad/shared";

export class RegisterClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(5)
  phone: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;
}
