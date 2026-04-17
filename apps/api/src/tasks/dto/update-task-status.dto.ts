import { IsEnum } from "class-validator";
import { TaskStatus } from "@hassad/shared";

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus, { message: "status must be a valid TaskStatus" })
  status: TaskStatus;
}
