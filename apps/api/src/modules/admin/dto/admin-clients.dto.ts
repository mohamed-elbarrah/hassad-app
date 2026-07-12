import { IsString, IsOptional, IsDateString, IsUUID, MinLength } from "class-validator";

export class SuspendClientDto {
  @IsString()
  @MinLength(1)
  reason: string;

  @IsOptional()
  @IsDateString()
  suspendedUntil?: string;
}

export class ReactivateClientDto {
  @IsString()
  @MinLength(1)
  reason: string;
}

export class AssignManagerDto {
  @IsUUID()
  accountManagerId: string;

  @IsString()
  @MinLength(1)
  reason: string;
}
