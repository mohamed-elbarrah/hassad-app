import { IsIn, IsOptional } from "class-validator";

export class CrmClientsWorkspaceQueryDto {
  @IsOptional()
  @IsIn(["all", "clients", "leads"])
  filter?: "all" | "clients" | "leads";

  @IsOptional()
  @IsIn(["highest-spend", "lowest-spend"])
  sort?: "highest-spend" | "lowest-spend";
}
