import { IsObject, IsNotEmpty } from "class-validator";

export class UpdateRequirementsDto {
  @IsObject()
  @IsNotEmpty()
  requirements: Record<string, unknown>;
}
