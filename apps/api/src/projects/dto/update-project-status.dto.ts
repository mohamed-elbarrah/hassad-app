import { IsEnum } from "class-validator";
import { ProjectStatus } from "@hassad/shared";

export class UpdateProjectStatusDto {
  @IsEnum(ProjectStatus, { message: "status must be a valid ProjectStatus" })
  status: ProjectStatus;
}
