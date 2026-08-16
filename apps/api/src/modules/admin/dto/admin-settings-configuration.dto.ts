import { IsIn, IsOptional, IsString } from "class-validator";
import { UpdateGatewayDto } from "../../payments/dto/update-gateway.dto";

export class CreateAdminGatewayDto extends UpdateGatewayDto {
  @IsString()
  @IsIn(["stripe", "bank_transfer"])
  name!: string;
}

export class UpdateAdminGatewayDto extends UpdateGatewayDto {}
