import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PmTaskAssignDto, PmTaskCommentDto, PmTaskFileDto, PmTaskStatusDto, PmTasksQueryDto } from "../dto/pm-tasks.dto";
import { PmTasksService } from "../services/pm-tasks.service";

@Controller("pm/tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PmTasksController {
  constructor(private readonly service: PmTasksService) {}

  @Get()
  @RequirePermissions("tasks.read")
  list(@CurrentUser("id") userId: string, @Query() query: PmTasksQueryDto) {
    return this.service.list(userId, query);
  }

  @Get("stats")
  @RequirePermissions("tasks.read")
  stats(@CurrentUser("id") userId: string) {
    return this.service.stats(userId);
  }

  @Get(":id")
  @RequirePermissions("tasks.read")
  detail(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.detail(userId, id);
  }

  @Patch(":id/status")
  @RequirePermissions("tasks.update")
  changeStatus(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: PmTaskStatusDto) {
    return this.service.changeStatus(userId, id, dto.status);
  }

  @Post(":id/assign")
  @RequirePermissions("tasks.assign")
  assign(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: PmTaskAssignDto) {
    return this.service.assign(userId, id, dto.userId);
  }

  @Post(":id/comments")
  @RequirePermissions("tasks.comment")
  addComment(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: PmTaskCommentDto) {
    return this.service.addComment(userId, id, dto.content, dto.isInternal ?? true);
  }

  @Get(":id/comments")
  @RequirePermissions("tasks.read")
  listComments(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.listComments(userId, id);
  }

  @Get(":id/files")
  @RequirePermissions("tasks.read")
  listFiles(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.listFiles(userId, id);
  }

  @Get(":id/files/:fileId/download")
  @RequirePermissions("tasks.read")
  downloadFile(@CurrentUser("id") userId: string, @Param("id") id: string, @Param("fileId") fileId: string) {
    return this.service.downloadFile(userId, id, fileId);
  }

  @Delete(":id/files/:fileId")
  @RequirePermissions("tasks.update")
  deleteFile(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Param("fileId") fileId: string,
  ) {
    return this.service.deleteFile(userId, id, fileId);
  }

  @Post(":id/files")
  @RequirePermissions("tasks.update")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: PmTaskFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(userId, id, file, dto.purpose);
  }
}
