import { IsString, MinLength, MaxLength } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: "Comment cannot be empty" })
  @MaxLength(2000, { message: "Comment cannot exceed 2000 characters" })
  content: string;
}
