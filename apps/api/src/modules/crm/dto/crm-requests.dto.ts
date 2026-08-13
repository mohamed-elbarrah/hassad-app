import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { BusinessType, ClientSource } from "@hassad/shared";
import { IsIn } from "class-validator";

export class CrmRequestServiceItemDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CrmRequestIntakeExistingClientDto {
  @IsUUID()
  @IsNotEmpty()
  clientId: string;
}

export class CrmRequestIntakeNewClientDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsNotEmpty()
  phoneWhatsapp: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsOptional()
  @IsUUID()
  accountManager?: string;
}

export class CrmCreateRequestIntakeDto {
  @IsIn(["existing", "new"])
  mode: "existing" | "new";

  @IsOptional()
  @ValidateNested()
  @Type(() => CrmRequestIntakeExistingClientDto)
  existingClient?: CrmRequestIntakeExistingClientDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CrmRequestIntakeNewClientDto)
  newClient?: CrmRequestIntakeNewClientDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrmRequestServiceItemDto)
  services: CrmRequestServiceItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;
}
