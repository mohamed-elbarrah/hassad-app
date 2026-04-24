import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ContactOutcome } from "@hassad/shared";

export class LogContactAttemptDto {
  @IsEnum(ContactOutcome, { message: "outcome must be a valid ContactOutcome" })
  outcome: ContactOutcome;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
