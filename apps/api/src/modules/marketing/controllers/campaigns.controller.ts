import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CampaignsService } from "../services/campaigns.service";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignMetricsDto,
  CampaignQueryDto,
} from "../dto/campaign.dto";
import { CampaignStatus } from "@hassad/shared";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("campaigns")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @RequirePermissions("marketing.create")
  create(@CurrentUser() user: any, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto, user.id);
  }

  @Get()
  @RequirePermissions("marketing.read")
  findAll(@Query() query: CampaignQueryDto) {
    return this.campaignsService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("marketing.read")
  findOne(@Param("id") id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(":id")
  @RequirePermissions("marketing.update")
  update(@Param("id") id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @Post(":id/kpis")
  @RequirePermissions("marketing.manage_kpis")
  createKpiSnapshot(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCampaignMetricsDto,
  ) {
    return this.campaignsService.createKpiSnapshot(id, dto, user.id);
  }

  @Get(":id/kpis")
  @RequirePermissions("marketing.read")
  getKpiSnapshots(
    @Param("id") id: string,
    @Query() query: { from?: string; to?: string },
  ) {
    return this.campaignsService.getKpiSnapshots(id, query);
  }

  @Post(":id/start")
  @RequirePermissions("marketing.update")
  start(@Param("id") id: string, @CurrentUser() user: any) {
    return this.campaignsService.updateStatus(id, CampaignStatus.ACTIVE, user.id);
  }

  @Post(":id/pause")
  @RequirePermissions("marketing.update")
  pause(@Param("id") id: string, @CurrentUser() user: any) {
    return this.campaignsService.updateStatus(id, CampaignStatus.PAUSED, user.id);
  }

  @Post(":id/stop")
  @RequirePermissions("marketing.update")
  stop(@Param("id") id: string, @CurrentUser() user: any) {
    return this.campaignsService.updateStatus(id, CampaignStatus.STOPPED, user.id);
  }

  @Post(":id/end")
  @RequirePermissions("marketing.update")
  end(@Param("id") id: string, @CurrentUser() user: any) {
    return this.campaignsService.updateStatus(
      id,
      CampaignStatus.COMPLETED,
      user.id,
    );
  }

  @Post(":id/duplicate")
  @RequirePermissions("marketing.create")
  duplicate(@Param("id") id: string, @CurrentUser() user: any) {
    return this.campaignsService.duplicate(id, user.id);
  }

  @Post(":id/flag-optimization")
  @RequirePermissions("marketing.flag_optimization")
  flagOptimization(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body("needsOptimization") needsOptimization: boolean,
  ) {
    return this.campaignsService.flagOptimization(id, needsOptimization, user.id);
  }
}

@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get(":taskId/campaigns")
  @RequirePermissions("marketing.read")
  findByTask(@Param("taskId") taskId: string) {
    return this.campaignsService.findByTask(taskId);
  }
}