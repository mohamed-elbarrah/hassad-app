import { IsOptional, IsString } from "class-validator";

export class GoogleAuthDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}
