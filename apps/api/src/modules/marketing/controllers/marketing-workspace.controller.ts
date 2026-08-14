import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CampaignStatus, TaskStatus } from "@hassad/shared";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { MarketingStrategyService } from "../services/marketing-strategy.service";
import { MarketingWorkspaceService } from "../services/marketing-workspace.service";
import { CreateCampaignDto, UpdateCampaignDto } from "../dto/campaign.dto";
import { MarketingCampaignKpiDto, MarketingCampaignQueryDto, MarketingStrategyQueryDto, MarketingTaskQueryDto } from "../dto/marketing-workspace.dto";
import { CreateTaskCommentDto, UploadTaskFileDto } from "../../tasks/dto/task.dto";

@Controller("marketing")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketingWorkspaceController {
  constructor(
    private readonly workspace: MarketingWorkspaceService,
    private readonly strategies: MarketingStrategyService,
    private readonly storage: StorageService,
  ) {}

  @Get("overview")
  @RequirePermissions("marketing.read")
  overview(@CurrentUser("id") userId: string, @Query() query: MarketingTaskQueryDto) { return this.workspace.overview(userId, query); }

  @Get("clients/:clientId")
  @RequirePermissions("marketing.read")
  clientView(@CurrentUser("id") userId: string, @Param("clientId") clientId: string) { return this.workspace.clientView(userId, clientId); }

  @Get("tasks")
  @RequirePermissions("marketing.read")
  tasks(@CurrentUser("id") userId: string, @Query() query: MarketingTaskQueryDto) { return this.workspace.listTasks(userId, query); }

  @Get("tasks/:id")
  @RequirePermissions("marketing.read")
  taskDetail(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.taskDetail(userId, id); }

  @Patch("tasks/:id/status")
  @RequirePermissions("tasks.update")
  taskStatus(@CurrentUser("id") userId: string, @Param("id") id: string, @Body("status") status: TaskStatus) { return this.workspace.changeTaskStatus(userId, id, status); }

  @Get("tasks/:id/comments")
  @RequirePermissions("marketing.read")
  taskComments(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.taskComments(userId, id); }

  @Post("tasks/:id/comments")
  @RequirePermissions("tasks.comment")
  addTaskComment(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: CreateTaskCommentDto) { return this.workspace.addTaskComment(userId, id, dto.content); }

  @Get("tasks/:id/files")
  @RequirePermissions("marketing.read")
  taskFiles(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.taskFiles(userId, id); }

  @Post("tasks/:id/files")
  @RequirePermissions("tasks.update")
  @UseInterceptors(FileInterceptor("file"))
  uploadTaskFile(@CurrentUser("id") userId: string, @Param("id") id: string, @UploadedFile() file: Express.Multer.File, @Body() dto: UploadTaskFileDto) { return this.workspace.uploadTaskFile(userId, id, file, dto.purpose); }

  @Get("tasks/:id/files/:fileId/download")
  @RequirePermissions("marketing.read")
  downloadTaskFile(@CurrentUser("id") userId: string, @Param("id") id: string, @Param("fileId") fileId: string) { return this.workspace.downloadTaskFile(userId, id, fileId); }

  @Get("strategies")
  @RequirePermissions("marketing.read")
  strategyList(@CurrentUser("id") userId: string, @Query() query: MarketingStrategyQueryDto) { return this.workspace.strategiesList(userId, query); }

  @Get("strategies/:id")
  @RequirePermissions("marketing.read")
  strategyDetail(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.strategyDetail(userId, id); }

  @Post("tasks/:taskId/strategy")
  @RequirePermissions("marketing.create")
  @UseInterceptors(FileInterceptor("file"))
  async createStrategy(@CurrentUser("id") userId: string, @Param("taskId") taskId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file || file.mimetype !== "application/pdf") throw new BadRequestException("A PDF strategy file is required");
    const upload = await this.storage.upload({ category: StorageCategory.MARKETING_STRATEGY, entityId: taskId, file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size } });
    return this.strategies.create(taskId, { key: upload.key, originalName: file.originalname, size: file.size, mimeType: file.mimetype }, userId);
  }

  @Post("strategies/:id/send")
  @RequirePermissions("marketing.update")
  sendStrategy(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.sendStrategy(userId, id); }

  @Post("strategies/:id/resubmit")
  @RequirePermissions("marketing.update")
  @UseInterceptors(FileInterceptor("file"))
  async resubmitStrategy(@CurrentUser("id") userId: string, @Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file || file.mimetype !== "application/pdf") throw new BadRequestException("A PDF strategy file is required");
    const upload = await this.storage.upload({ category: StorageCategory.MARKETING_STRATEGY, entityId: id, file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size } });
    return this.workspace.resubmitStrategy(userId, id, { key: upload.key, originalName: file.originalname, size: file.size, mimeType: file.mimetype });
  }

  @Get("strategies/:id/download")
  @RequirePermissions("marketing.read")
  strategyDownload(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.strategyDownload(userId, id); }

  @Get("campaigns")
  @RequirePermissions("marketing.read")
  campaignList(@CurrentUser("id") userId: string, @Query() query: MarketingCampaignQueryDto) { return this.workspace.campaignsList(userId, query); }

  @Get("campaigns/:id")
  @RequirePermissions("marketing.read")
  campaignDetail(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.campaignDetail(userId, id); }

  @Post("campaigns")
  @RequirePermissions("marketing.create")
  createCampaign(@CurrentUser("id") userId: string, @Body() dto: CreateCampaignDto) { return this.workspace.createCampaign(userId, dto); }

  @Patch("campaigns/:id")
  @RequirePermissions("marketing.update")
  updateCampaign(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: UpdateCampaignDto) { return this.workspace.updateCampaign(userId, id, dto); }

  @Post("campaigns/:id/start")
  @RequirePermissions("marketing.update")
  startCampaign(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.campaignStatus(userId, id, CampaignStatus.ACTIVE); }

  @Post("campaigns/:id/pause")
  @RequirePermissions("marketing.update")
  pauseCampaign(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.campaignStatus(userId, id, CampaignStatus.PAUSED); }

  @Post("campaigns/:id/stop")
  @RequirePermissions("marketing.update")
  stopCampaign(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.campaignStatus(userId, id, CampaignStatus.STOPPED); }

  @Post("campaigns/:id/end")
  @RequirePermissions("marketing.update")
  endCampaign(@CurrentUser("id") userId: string, @Param("id") id: string) { return this.workspace.campaignStatus(userId, id, CampaignStatus.COMPLETED); }

  @Get("campaigns/:id/kpis")
  @RequirePermissions("marketing.read")
  campaignKpis(@CurrentUser("id") userId: string, @Param("id") id: string, @Query() query: any) { return this.workspace.campaignKpis(userId, id, query); }

  @Post("campaigns/:id/kpis")
  @RequirePermissions("marketing.manage_kpis")
  campaignKpi(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: MarketingCampaignKpiDto) { return this.workspace.campaignKpi(userId, id, dto); }

  @Patch("campaigns/:id/optimization")
  @RequirePermissions("marketing.flag_optimization")
  optimization(@CurrentUser("id") userId: string, @Param("id") id: string, @Body("needsOptimization") value: boolean) { return this.workspace.optimization(userId, id, value); }
}
