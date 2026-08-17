import {
  IsString,
  IsArray,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  Matches,
} from "class-validator";

const NON_WHITESPACE = /\S/;

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(NON_WHITESPACE)
  name: string;
}

export class AssignPermissionsDto {
  @IsArray()
  @IsUUID("all", { each: true })
  permissionIds: string[];
}

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(NON_WHITESPACE)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignDepartmentDto {
  @IsNotEmpty()
  @IsUUID("all")
  departmentId: string;
}
