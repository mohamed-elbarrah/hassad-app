import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProjectsService } from '../services/projects.service';
import { TasksService } from '../../tasks/services/tasks.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from '../dto/project.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  @RequirePermissions('projects.create')
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @RequirePermissions('projects.read')
  findAll(@Query() filters: any) {
    return this.projectsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('projects.update')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Post(':id/archive')
  @RequirePermissions('projects.archive')
  archive(@Param('id') id: string) {
    return this.projectsService.archive(id);
  }

  @Post(':id/members')
  @RequirePermissions('projects.manage_members')
  addMember(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.projectsService.addMember(id, addMemberDto, user.id);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('projects.manage_members')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }

  @Patch(':id/status')
  @RequirePermissions('projects.update')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.projectsService.updateStatus(id, body.status);
  }

  @Get(':id/tasks')
  @RequirePermissions('tasks.read')
  getTasksByProject(@Param('id') projectId: string) {
    return this.tasksService.findByProject(projectId);
  }

  @Post(':id/files')
  @RequirePermissions('projects.update')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projectsService.uploadFile(id, user.id, file);
  }

  @Get(':id/files')
  @RequirePermissions('projects.read')
  getFiles(@Param('id') id: string) {
    return this.projectsService.getFiles(id);
  }

  @Delete(':id/files/:fileId')
  @RequirePermissions('projects.update')
  deleteFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projectsService.deleteFile(id, fileId);
  }
}