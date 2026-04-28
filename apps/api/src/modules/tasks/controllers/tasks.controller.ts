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
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto, CreateTaskFileDto, CreateTaskCommentDto } from '../dto/task.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('my')
  @RequirePermissions('tasks.read')
  getMyTasks(@CurrentUser() user: any, @Query() filters: any) {
    return this.tasksService.findMine(user.id, filters);
  }

  @Get('my/stats')
  @RequirePermissions('tasks.read')
  getMyStats(@CurrentUser() user: any) {
    return this.tasksService.myStats(user.id);
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
  addFile(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateTaskFileDto) {
    return this.tasksService.addFile(id, user.id, dto);
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

  @Delete(':id/files/:fileId')
  @RequirePermissions('tasks.update')
  deleteFile(@Param('id') taskId: string, @Param('fileId') fileId: string) {
    return this.tasksService.deleteFile(taskId, fileId);
  }
}
