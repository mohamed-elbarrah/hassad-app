import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  MinLength,
  Matches,
} from "class-validator";
import { BusinessType, ClientSource } from "@hassad/shared";

/**
 * DTO for creating a new client.
 * Validated by class-validator (ValidationPipe with whitelist:true).
 * Mirrors CreateClientSchema from @hassad/shared.
 *
 * Fields excluded intentionally:
 *   - `status`  → always set to LEAD on creation (server logic)
 *   - `stage`   → always set to NEW_LEAD on creation (server logic)
 *   - `assignedToId` → optional for ADMIN, auto-assigned otherwise
 */
export class CreateClientDto {
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  @IsString()
  @MinLength(5, { message: "Phone must be at least 5 characters" })
  phone: string;

  @IsEnum(BusinessType, {
    message: "businessType must be a valid BusinessType",
  })
  businessType: BusinessType;

  @IsEnum(ClientSource, { message: "source must be a valid ClientSource" })
  source: ClientSource;

  @IsOptional()
  @Matches(/^c[^\s-]{8,}$/i, {
    message: "assignedToId must be a valid CUID",
  })
  assignedToId?: string;
}
