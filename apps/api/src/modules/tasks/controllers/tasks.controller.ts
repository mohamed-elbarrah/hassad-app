import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TasksService } from "../services/tasks.service";
import {
  TaskAccessPolicyService,
  TaskAccessAction,
} from "../services/task-access-policy.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  UploadTaskFileDto,
  CreateTaskCommentDto,
} from "../dto/task.dto";
import { TaskDepartment, TaskStatus, type UserRole } from "@hassad/shared";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";

type TaskDetailResponse = Awaited<ReturnType<TasksService["findOne"]>>;

@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly storageService: StorageService,
    private readonly taskAccessPolicy: TaskAccessPolicyService,
  ) {}

  private authorize(
    id: string,
    user: { id: string; role: UserRole },
    action: TaskAccessAction,
  ) {
    return this.taskAccessPolicy.authorize(id, user, action);
  }

  private sanitizeTask(
    task: TaskDetailResponse,
    user: { id: string; role: UserRole },
    canViewAllAssignmentHistory: boolean,
  ) {
    const staffAssignee =
      user.role === "TEAM" || user.role === "MARKETING";
    return {
      ...task,
      ...(staffAssignee
        ? {
            comments: task.comments.filter((comment) => !comment.isInternal),
            project: task.project
              ? {
                  id: task.project.id,
                  name: task.project.name,
                  clientId: task.project.clientId,
                  client: task.project.client
                    ? {
                        id: task.project.client.id,
                        companyName: task.project.client.companyName,
                      }
                    : null,
                }
              : null,
          }
        : {}),
      assignmentHistory: canViewAllAssignmentHistory
        ? task.assignmentHistory
        : task.assignmentHistory.filter(
            (entry) =>
              entry.previousAssigneeId === user.id ||
              entry.newAssigneeId === user.id,
          ),
    };
  }

  @Get("pm")
  @RequirePermissions("tasks.read")
  getPmTasks(@CurrentUser() user: any, @Query() filters: any) {
    return this.tasksService.findPmTasks(user.id, filters);
  }

  @Get("pm/stats")
  @RequirePermissions("tasks.read")
  getPmStats(@CurrentUser() user: any) {
    return this.tasksService.pmStats(user.id);
  }

  @Get("my")
  @RequirePermissions("tasks.read")
  getMyTasks(@CurrentUser() user: any, @Query() filters: any) {
    const includeCampaigns =
      filters.includeCampaigns === "true" || filters.includeCampaigns === true;
    return this.tasksService.findMine(user.id, filters, includeCampaigns);
  }

  @Get("my/stats")
  @RequirePermissions("tasks.read")
  getMyStats(@CurrentUser() user: any) {
    return this.tasksService.myStats(user.id);
  }

  @Get("assignees")
  @RequirePermissions("tasks.assign")
  getAssignableUsers(
    @Query("dept") dept?: TaskDepartment,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
  ) {
    return this.tasksService.searchAssignableUsers({
      dept,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @RequirePermissions("tasks.create")
  create(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Get(":id")
  @RequirePermissions("tasks.read")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const access = await this.authorize(id, user, "detail");
    return this.sanitizeTask(
      await this.tasksService.findOne(id),
      user,
      access.canViewAllAssignmentHistory,
    );
  }

  @Patch(":id")
  @RequirePermissions("tasks.update")
  async update(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTaskDto,
  ) {
    await this.authorize(id, user, "management");
    return this.tasksService.update(id, dto);
  }

  @Post(":id/assign")
  @RequirePermissions("tasks.assign")
  async assign(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: AssignTaskDto,
  ) {
    await this.authorize(id, user, "management");
    return this.tasksService.assign(id, user.id, dto);
  }

  @Post(":id/start")
  @RequirePermissions("tasks.update")
  async start(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "mutation");
    return this.tasksService.start(id, user.id);
  }

  @Post(":id/submit")
  @RequirePermissions("tasks.update")
  async submit(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "mutation");
    return this.tasksService.submit(id, user.id);
  }

  @Post(":id/approve")
  @RequirePermissions("tasks.approve")
  async approve(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "mutation");
    return this.tasksService.approve(id, user.id);
  }

  @Post(":id/reject")
  @RequirePermissions("tasks.approve")
  async reject(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "mutation");
    return this.tasksService.reject(id, user.id);
  }

  @Post(":id/files")
  @RequirePermissions("tasks.update")
  @UseInterceptors(FileInterceptor("file"))
  async addFile(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTaskFileDto,
  ) {
    await this.authorize(id, user, "mutation");
    if (!file)
      throw new BadRequestException({ code: "FILE_REQUIRED", details: {} });
    const uploadResult = await this.storageService.upload({
      category: StorageCategory.TASK_FILE,
      entityId: id,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
    try {
      return await this.tasksService.addFile(id, user.id, {
        key: uploadResult.key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        purpose: dto.purpose,
      });
    } catch (error) {
      await this.storageService.deleteByKey(uploadResult.key).catch(() => {});
      throw error;
    }
  }

  @Get(":id/files/:fileId/download")
  @RequirePermissions("tasks.read")
  async downloadFile(
    @Param("id") taskId: string,
    @Param("fileId") fileId: string,
    @CurrentUser() user: any,
  ) {
    await this.taskAccessPolicy.authorizeDownload(taskId, fileId, user);
    return { url: await this.tasksService.getDownloadUrl(taskId, fileId) };
  }

  @Get(":id/files")
  @RequirePermissions("tasks.read")
  async getFiles(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "files");
    return this.tasksService.getFiles(id);
  }

  @Post(":id/comments")
  @RequirePermissions("tasks.comment")
  async addComment(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTaskCommentDto,
  ) {
    await this.authorize(id, user, "mutation");
    return this.tasksService.addComment(id, user.id, dto);
  }

  @Get(":id/comments")
  @RequirePermissions("tasks.read")
  async getComments(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "comments");
    return this.tasksService.getComments(id);
  }

  @Delete(":id")
  @RequirePermissions("tasks.delete")
  async delete(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "management");
    return this.tasksService.delete(id);
  }

  @Patch(":id/archive")
  @RequirePermissions("tasks.update")
  async archive(@Param("id") id: string, @CurrentUser() user: any) {
    await this.authorize(id, user, "management");
    return this.tasksService.toggleArchive(id);
  }

  @Patch(":id/status")
  @RequirePermissions("tasks.update")
  async changeStatus(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body("status") status: TaskStatus,
  ) {
    await this.authorize(id, user, "mutation");
    return this.tasksService.changeStatus(id, user.id, status);
  }

  @Delete(":id/files/:fileId")
  @RequirePermissions("tasks.update")
  async deleteFile(
    @Param("id") taskId: string,
    @Param("fileId") fileId: string,
    @CurrentUser() user: any,
  ) {
    await this.authorize(taskId, user, "management");
    return this.tasksService.deleteFile(taskId, fileId);
  }
}
