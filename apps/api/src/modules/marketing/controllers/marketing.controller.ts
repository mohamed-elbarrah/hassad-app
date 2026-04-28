import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarketingService } from '../services/marketing.service';
import { CreateCampaignDto, CreateKpiSnapshotDto, CreateAbTestDto } from '../dto/marketing.dto';
import { CampaignStatus } from '@hassad/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post()
  @RequirePermissions('marketing.create')
  createCampaign(@CurrentUser() user: any, @Body() dto: CreateCampaignDto) {
    return this.marketingService.createCampaign(user.id, dto);
  }

  @Get()
  @RequirePermissions('marketing.read')
  findAll(@Query() filters: any) {
    return this.marketingService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('marketing.read')
  findCampaign(@Param('id') id: string) {
    return this.marketingService.findCampaign(id);
  }

  @Post(':id/start')
  @RequirePermissions('marketing.update')
  start(@Param('id') id: string) {
    return this.marketingService.updateCampaignStatus(id, CampaignStatus.ACTIVE);
  }

  @Post(':id/pause')
  @RequirePermissions('marketing.update')
  pause(@Param('id') id: string) {
    return this.marketingService.updateCampaignStatus(id, CampaignStatus.PAUSED);
  }

  @Post(':id/end')
  @RequirePermissions('marketing.update')
  end(@Param('id') id: string) {
    return this.marketingService.updateCampaignStatus(id, CampaignStatus.COMPLETED);
  }

  @Post(':id/kpis')
  @RequirePermissions('marketing.manage_kpis')
  addKpis(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateKpiSnapshotDto) {
    return this.marketingService.addKpiSnapshot(id, user.id, dto);
  }

  @Get(':id/kpis')
  @RequirePermissions('marketing.read')
  getKpis(@Param('id') id: string) {
    return this.marketingService.getKpiSnapshots(id);
  }

  @Post(':id/ab-tests')
  @RequirePermissions('marketing.manage_tests')
  createAbTest(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateAbTestDto) {
    return this.marketingService.createAbTest(id, user.id, dto);
  }
}
