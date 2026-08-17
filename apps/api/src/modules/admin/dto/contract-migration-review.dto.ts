import { IsUUID } from "class-validator";

export class ResolveContractMigrationReviewDto {
  @IsUUID()
  requestId: string;
}
