import { IsString, IsArray, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;
}

export class AssignPermissionsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsString()
  description?: string;
}
