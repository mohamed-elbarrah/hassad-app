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
  Redirect,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TasksService } from '../services/tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  UploadTaskFileDto,
  CreateTaskCommentDto,
} from '../dto/task.dto';
import { TaskDepartment, TaskStatus } from '@hassad/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StorageService } from '../../../common/storage/storage.service';
import { StorageCategory } from '../../../common/storage/storage.constants';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly storageService: StorageService,
  ) {}

  @Get('my')
  @RequirePermissions('tasks.read')
  getMyTasks(@CurrentUser() user: any, @Query() filters: any) {
    const includeCampaigns = filters.includeCampaigns === 'true' || filters.includeCampaigns === true;
    return this.tasksService.findMine(user.id, filters, includeCampaigns);
  }

  @Get('my/stats')
  @RequirePermissions('tasks.read')
  getMyStats(@CurrentUser() user: any) {
    return this.tasksService.myStats(user.id);
  }

  @Get('assignees')
  @RequirePermissions('tasks.assign')
  getAssignableUsers(
    @Query('dept') dept?: TaskDepartment,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasksService.searchAssignableUsers({
      dept,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @RequirePermissions('tasks.create')
  create(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Get(':id')
  @RequirePermissions('tasks.read')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('tasks.update')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Post(':id/assign')
  @RequirePermissions('tasks.assign')
  assign(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: AssignTaskDto) {
    return this.tasksService.assign(id, user.id, dto);
  }

  @Post(':id/start')
  @RequirePermissions('tasks.update')
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.start(id, user.id);
  }

  @Post(':id/submit')
  @RequirePermissions('tasks.update')
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.submit(id, user.id);
  }

  @Post(':id/approve')
  @RequirePermissions('tasks.approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.approve(id, user.id);
  }

  @Post(':id/reject')
  @RequirePermissions('tasks.approve') // PM or Admin rejects
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.reject(id, user.id);
  }

  @Post(':id/files')
  @RequirePermissions('tasks.update')
  @UseInterceptors(FileInterceptor('file'))
  async addFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTaskFileDto,
  ) {
    if (!file) {
      throw new Error('Task file is required');
    }
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
    return this.tasksService.addFile(id, user.id, {
      key: uploadResult.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      purpose: dto.purpose,
    });
  }

  @Get(':id/files/:fileId/download')
  @RequirePermissions('tasks.read')
  @Redirect()
  async downloadFile(
    @Param('id') taskId: string,
    @Param('fileId') fileId: string,
  ) {
    const presignedUrl = await this.tasksService.getDownloadUrl(taskId, fileId);
    return { url: presignedUrl, statusCode: 302 };
  }

  @Get(':id/files')
  @RequirePermissions('tasks.read')
  getFiles(@Param('id') id: string) {
    return this.tasksService.getFiles(id);
  }

  @Post(':id/comments')
  @RequirePermissions('tasks.comment')
  addComment(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateTaskCommentDto) {
    return this.tasksService.addComment(id, user.id, dto);
  }

  @Get(':id/comments')
  @RequirePermissions('tasks.read')
  getComments(@Param('id') id: string) {
    return this.tasksService.getComments(id);
  }

  @Delete(':id')
  @RequirePermissions('tasks.delete')
  delete(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }

  @Patch(':id/archive')
  @RequirePermissions('tasks.update')
  archive(@Param('id') id: string) {
    return this.tasksService.toggleArchive(id);
  }

  @Patch(':id/status')
  @RequirePermissions('tasks.update')
  changeStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: TaskStatus,
  ) {
    return this.tasksService.changeStatus(id, user.id, status);
  }

  @Delete(':id/files/:fileId')
  @RequirePermissions('tasks.update')
  deleteFile(@Param('id') taskId: string, @Param('fileId') fileId: string) {
    return this.tasksService.deleteFile(taskId, fileId);
  }
}
