import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PmProjectActionsService } from "../services/pm-project-actions.service";
import { AssignPmTaskDto, CreatePmMeetingDto, CreatePmTaskDto, PmAssignableUsersQueryDto, UpdatePmMeetingDto, UploadPmProjectFileDto } from "../dto/pm-project-actions.dto";

@Controller("pm")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PmProjectActionsController {
  constructor(private readonly service: PmProjectActionsService) {}

  @Get("projects/:id/assignable-users")
  @RequirePermissions("tasks.assign")
  assignableUsers(@CurrentUser("id") userId: string, @Param("id") projectId: string, @Query() query: PmAssignableUsersQueryDto) {
    return this.service.listAssignableUsers(userId, projectId, query);
  }

  @Post("projects/:id/tasks")
  @RequirePermissions("tasks.create")
  createTask(@CurrentUser("id") userId: string, @Param("id") projectId: string, @Body() dto: CreatePmTaskDto) {
    return this.service.createTask(userId, projectId, dto);
  }

  @Post("projects/:id/tasks/:taskId/assign")
  @RequirePermissions("tasks.assign")
  assignTask(
    @CurrentUser("id") userId: string,
    @Param("id") projectId: string,
    @Param("taskId") taskId: string,
    @Body() dto: AssignPmTaskDto,
  ) {
    return this.service.assignTask(userId, projectId, taskId, dto.userId);
  }

  @Post("projects/:id/meetings")
  @RequirePermissions("projects.update")
  createMeeting(@CurrentUser("id") userId: string, @Param("id") projectId: string, @Body() dto: CreatePmMeetingDto) {
    return this.service.createMeeting(userId, projectId, dto);
  }

  @Patch("projects/:id/meetings/:meetingId")
  @RequirePermissions("projects.update")
  updateMeeting(
    @CurrentUser("id") userId: string,
    @Param("id") projectId: string,
    @Param("meetingId") meetingId: string,
    @Body() dto: UpdatePmMeetingDto,
  ) {
    return this.service.updateMeeting(userId, projectId, meetingId, dto);
  }

  @Post("projects/:id/files")
  @RequirePermissions("projects.update")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@CurrentUser("id") userId: string, @Param("id") projectId: string, @Body() dto: UploadPmProjectFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(userId, projectId, dto, file);
  }

  @Get("projects/:id/files")
  @RequirePermissions("projects.read")
  listFiles(@CurrentUser("id") userId: string, @Param("id") projectId: string) {
    return this.service.listFiles(userId, projectId);
  }

  @Delete("projects/:id/files/:fileId")
  @RequirePermissions("projects.update")
  deleteFile(
    @CurrentUser("id") userId: string,
    @Param("id") projectId: string,
    @Param("fileId") fileId: string,
  ) {
    return this.service.deleteFile(userId, projectId, fileId);
  }

  @Get("projects/:id/files/:fileId/download")
  @RequirePermissions("projects.read")
  downloadFile(@CurrentUser("id") userId: string, @Param("id") projectId: string, @Param("fileId") fileId: string) {
    return this.service.getFileDownloadUrl(userId, projectId, fileId);
  }
}
