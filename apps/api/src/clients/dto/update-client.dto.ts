import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  MinLength,
  Matches,
  ValidateIf,
} from "class-validator";
import {
  BusinessType,
  ClientSource,
  ClientStatus,
  PipelineStage,
} from "@hassad/shared";

/**
 * DTO for partial updates to an existing client record.
 * Mirrors UpdateClientSchema from @hassad/shared.
 * All fields are optional but at least one is required (enforced by class-validator).
 *
 * Note: Stage transitions also have a dedicated PATCH /:id/stage endpoint.
 */
export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  name?: string;

  @IsOptional()
  @ValidateIf((o: UpdateClientDto) => o.email !== null)
  @IsEmail({}, { message: "Invalid email address" })
  email?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: "Phone must be at least 5 characters" })
  phone?: string;

  @IsOptional()
  @IsEnum(BusinessType, {
    message: "businessType must be a valid BusinessType",
  })
  businessType?: BusinessType;

  @IsOptional()
  @IsEnum(ClientSource, { message: "source must be a valid ClientSource" })
  source?: ClientSource;

  @IsOptional()
  @IsEnum(ClientStatus, { message: "status must be a valid ClientStatus" })
  status?: ClientStatus;

  @IsOptional()
  @IsEnum(PipelineStage, { message: "stage must be a valid PipelineStage" })
  stage?: PipelineStage;

  @IsOptional()
  @IsString()
  @Matches(/^c[^\s-]{8,}$/i, { message: "assignedToId must be a valid CUID" })
  assignedToId?: string;
}
