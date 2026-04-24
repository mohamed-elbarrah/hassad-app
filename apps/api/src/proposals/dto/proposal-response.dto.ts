import { IsOptional, IsString, MaxLength } from "class-validator";

export class ProposalResponseDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
