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
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProjectsService } from "../services/projects.service";
import { ProjectPeriodsService } from "../services/project-periods.service";
import { TasksService } from "../../tasks/services/tasks.service";
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
} from "../dto/project.dto";
import {
  SavePeriodSummaryDto,
  ExtendPeriodDto,
  ClosePeriodDto,
  SetPeriodCompletionDto,
  CreateMeetingDto,
  UpdateMeetingDto,
} from "../dto/project-period.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";

@Controller("projects")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly periodsService: ProjectPeriodsService,
    private readonly tasksService: TasksService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @RequirePermissions("projects.create")
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @RequirePermissions("projects.read")
  findAll(@Query() filters: any) {
    return this.projectsService.findAll(filters);
  }

  @Get("pm/revisions")
  @RequirePermissions("projects.read")
  findPmRevisions(@CurrentUser() user: any) {
    return this.projectsService.findPmRevisions(user.id);
  }

  @Get(":id")
  @RequirePermissions("projects.read")
  findOne(@Param("id") id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(":id")
  @RequirePermissions("projects.update")
  update(@Param("id") id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Post(":id/archive")
  @RequirePermissions("projects.archive")
  archive(@Param("id") id: string) {
    return this.projectsService.archive(id);
  }

  @Post(":id/members")
  @RequirePermissions("projects.manage_members")
  addMember(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.projectsService.addMember(id, addMemberDto, user.id);
  }

  @Delete(":id/members/:userId")
  @RequirePermissions("projects.manage_members")
  removeMember(@Param("id") id: string, @Param("userId") userId: string) {
    return this.projectsService.removeMember(id, userId);
  }

  @Patch(":id/status")
  @RequirePermissions("projects.update")
  updateStatus(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: { status: string },
  ) {
    return this.projectsService.updateStatus(id, body.status, user?.id);
  }

  // ─── Periods (monthly delivery/billing units for retainer projects) ────────────

  @Get(":id/periods")
  @RequirePermissions("projects.read")
  listPeriods(@Param("id") id: string) {
    return this.periodsService.listPeriods(id);
  }

  @Post(":id/periods/generate")
  @RequirePermissions("projects.update")
  generatePeriods(@CurrentUser() user: any, @Param("id") id: string) {
    return this.periodsService.generatePeriods(id, user?.id);
  }

  @Get("periods/:periodId")
  @RequirePermissions("projects.read")
  getPeriodDetail(@Param("periodId") periodId: string) {
    return this.periodsService.getPeriodDetail(periodId);
  }

  @Post("periods/:periodId/close")
  @RequirePermissions("projects.update")
  closePeriod(
    @CurrentUser() user: any,
    @Param("periodId") periodId: string,
    @Body() dto: ClosePeriodDto,
  ) {
    return this.periodsService.closePeriod(periodId, user?.id, dto.reason);
  }

  @Post("periods/:periodId/open")
  @RequirePermissions("projects.update")
  openPeriod(@CurrentUser() user: any, @Param("periodId") periodId: string) {
    return this.periodsService.openPeriod(periodId, user?.id);
  }

  @Patch("periods/:periodId/extend")
  @RequirePermissions("projects.update")
  extendPeriod(
    @CurrentUser() user: any,
    @Param("periodId") periodId: string,
    @Body() dto: ExtendPeriodDto,
  ) {
    return this.periodsService.extendPeriod(periodId, dto.endDate, user?.id);
  }

  @Post(":id/periods/extra")
  @RequirePermissions("projects.update")
  createExtraPeriod(@CurrentUser() user: any, @Param("id") id: string) {
    return this.periodsService.createExtraPeriod(id, user?.id);
  }

  @Patch("periods/:periodId/summary")
  @RequirePermissions("projects.update")
  savePeriodSummary(
    @Param("periodId") periodId: string,
    @Body() dto: SavePeriodSummaryDto,
  ) {
    return this.periodsService.saveSummary(periodId, dto.summary);
  }

  @Patch("periods/:periodId/completion")
  @RequirePermissions("projects.update")
  setPeriodCompletion(
    @Param("periodId") periodId: string,
    @Body() dto: SetPeriodCompletionDto,
  ) {
    return this.periodsService.setCompletion(
      periodId,
      dto.completionPercentage,
    );
  }

  @Patch("periods/:periodId/goals")
  @RequirePermissions("projects.update")
  savePeriodGoals(
    @Param("periodId") periodId: string,
    @Body()
    dto: {
      goals: Array<{
        title: string;
        description?: string;
        progress: number;
        status: string;
      }>;
    },
  ) {
    return this.periodsService.saveGoals(periodId, dto.goals);
  }

  @Post("periods/:periodId/report")
  @RequirePermissions("projects.update")
  @UseInterceptors(FileInterceptor("file"))
  async uploadPeriodReport(
    @Param("periodId") periodId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Report file is required");
    const uploadResult = await this.storageService.upload({
      category: StorageCategory.PROJECT_FILE,
      entityId: periodId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
    return this.periodsService.saveReport(periodId, uploadResult.key);
  }

  @Get("periods/:periodId/report/download")
  @RequirePermissions("projects.read")
  async downloadPeriodReport(@Param("periodId") periodId: string) {
    const url = await this.periodsService.getReportDownloadUrl(periodId);
    return { url };
  }

  // ─── Meetings (PM-scheduled, per-period, visible to client) ────────────────────

  @Post("periods/:periodId/meetings")
  @RequirePermissions("projects.update")
  createMeeting(
    @CurrentUser() user: any,
    @Param("periodId") periodId: string,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.periodsService.createMeeting(periodId, user?.id, dto);
  }

  @Patch("meetings/:meetingId")
  @RequirePermissions("projects.update")
  updateMeeting(
    @CurrentUser() user: any,
    @Param("meetingId") meetingId: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.periodsService.updateMeeting(meetingId, user?.id, dto);
  }

  @Get(":id/tasks")
  @RequirePermissions("tasks.read")
  getTasksByProject(@Param("id") projectId: string) {
    return this.tasksService.findByProject(projectId);
  }

  @Post(":id/files")
  @RequirePermissions("projects.update")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error("File is required");
    }
    const uploadResult = await this.storageService.upload({
      category: StorageCategory.PROJECT_FILE,
      entityId: id,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
    return this.projectsService.uploadFile(id, user.id, {
      key: uploadResult.key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  @Get(":id/files")
  @RequirePermissions("projects.read")
  getFiles(@Param("id") id: string) {
    return this.projectsService.getFiles(id);
  }

  @Delete(":id/files/:fileId")
  @RequirePermissions("projects.update")
  deleteFile(@Param("id") id: string, @Param("fileId") fileId: string) {
    return this.projectsService.deleteFile(id, fileId);
  }
}
