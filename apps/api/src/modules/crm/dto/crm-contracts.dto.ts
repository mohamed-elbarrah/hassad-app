import { IsIn, IsOptional, IsString } from "class-validator";

export class CrmContractsWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["all", "sent", "signed", "active", "on-hold", "expired", "cancelled"])
  status?: "all" | "sent" | "signed" | "active" | "on-hold" | "expired" | "cancelled";

  @IsOptional()
  @IsString()
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
