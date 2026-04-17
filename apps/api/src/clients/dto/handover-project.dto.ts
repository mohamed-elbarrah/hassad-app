import { IsString, IsDateString, MinLength, Matches } from "class-validator";

export class HandoverProjectDto {
  @IsString()
  @MinLength(2)
  name: string;

  @Matches(/^c[^\s-]{8,}$/i, { message: "managerId must be a valid CUID" })
  managerId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
