import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TaskStatus } from "@hassad/shared";

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import {
  TeamTaskCommentDto,
  TeamTaskFileDto,
  TeamTasksQueryDto,
  TeamTaskStatusDto,
} from "../dto/team-tasks.dto";
import { TeamTasksService } from "../services/team-tasks.service";

@Controller("team")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeamTasksController {
  constructor(private readonly service: TeamTasksService) {}

  @Get("overview")
  @RequirePermissions("tasks.read")
  overview(@CurrentUser("id") userId: string, @Query() query: TeamTasksQueryDto) {
    return this.service.overview(userId, query);
  }

  @Get("tasks")
  @RequirePermissions("tasks.read")
  list(@CurrentUser("id") userId: string, @Query() query: TeamTasksQueryDto) {
    return this.service.list(userId, query);
  }

  @Get("tasks/:id")
  @RequirePermissions("tasks.read")
  detail(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.detail(userId, id);
  }

  @Patch("tasks/:id/status")
  @RequirePermissions("tasks.update")
  changeStatus(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: TeamTaskStatusDto,
  ) {
    return this.service.changeStatus(userId, id, dto.status as TaskStatus);
  }

  @Post("tasks/:id/comments")
  @RequirePermissions("tasks.comment")
  addComment(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: TeamTaskCommentDto,
  ) {
    return this.service.addComment(userId, id, dto.content);
  }

  @Get("tasks/:id/comments")
  @RequirePermissions("tasks.read")
  comments(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.comments(userId, id);
  }

  @Post("tasks/:id/files")
  @RequirePermissions("tasks.update")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: TeamTaskFileDto,
  ) {
    return this.service.uploadFile(userId, id, file, dto.purpose);
  }

  @Get("tasks/:id/files")
  @RequirePermissions("tasks.read")
  files(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.files(userId, id);
  }

  @Get("tasks/:id/files/:fileId/download")
  @RequirePermissions("tasks.read")
  downloadFile(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Param("fileId") fileId: string,
  ) {
    return this.service.downloadFile(userId, id, fileId);
  }
}
