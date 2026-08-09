import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class AdminOverviewWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsIn(["day", "month", "quarter"])
  granularity?: "day" | "month" | "quarter";
}

export class AdminEmployeesWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  roles?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminClientsWorkspaceQueryDto {
  @IsOptional()
  @IsIn(["all", "clients", "leads"])
  filter?: "all" | "clients" | "leads";

  @IsOptional()
  @IsIn(["highest-spend", "lowest-spend"])
  sort?: "highest-spend" | "lowest-spend";
}

export class AdminCrmWorkspaceQueryDto {
  @IsOptional()
  @IsIn(["all", "active", "waiting-approval", "stalled"])
  statusFilter?: "all" | "active" | "waiting-approval" | "stalled";

  @IsOptional()
  @IsIn(["all-time", "last-7-days", "last-30-days", "last-90-days"])
  dateFilter?: "all-time" | "last-7-days" | "last-30-days" | "last-90-days";

  @IsOptional()
  @IsIn([
    "all-values",
    "under-15000",
    "15000-30000",
    "30000-50000",
    "50000-plus",
  ])
  valueFilter?:
    | "all-values"
    | "under-15000"
    | "15000-30000"
    | "30000-50000"
    | "50000-plus";
}

export class AdminDeliveryWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["all", "active", "attention", "completed"])
  statusFilter?: "all" | "active" | "attention" | "completed";

  @IsOptional()
  @IsIn(["all-models", "recurring", "one-off"])
  modelFilter?: "all-models" | "recurring" | "one-off";

  @IsOptional()
  @IsIn(["all-timelines", "ending-soon", "overdue", "archived"])
  timelineFilter?: "all-timelines" | "ending-soon" | "overdue" | "archived";

  @IsOptional()
  @IsIn(["highest-value", "ending-soon", "newest"])
  sort?: "highest-value" | "ending-soon" | "newest";
}
