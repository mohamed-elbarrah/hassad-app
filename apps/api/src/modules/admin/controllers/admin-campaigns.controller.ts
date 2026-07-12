import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";

import { AdminCampaignsService } from "../services/admin-campaigns.service";

import { AdminCreateCampaignDto, AdminUpdateCampaignDto } from "../dto/admin-campaign.dto";

import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("admin/campaigns")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminCampaignsController {
  constructor(private readonly service: AdminCampaignsService) {}

  @Post()
  @RequirePermissions("admin.campaigns.create")
  create(@CurrentUser() user: any, @Body() dto: AdminCreateCampaignDto) {
    return this.service.create(dto, user.id);
  }

  @Get() @RequirePermissions("admin.campaigns.read") findAll(@Query() q: any) {
    return this.service.findAll(q);
  }
  @Get(":id") @RequirePermissions("admin.campaigns.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }
  @Patch(":id") @RequirePermissions("admin.campaigns.intervene") update(
    @Param("id") id: string,
    @Body() dto: AdminUpdateCampaignDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id);
  }
  @Post(":id/pause") @RequirePermissions("admin.campaigns.intervene") pause(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.service.pause(id, userId);
  }
  @Post(":id/end") @RequirePermissions("admin.campaigns.intervene") end(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.service.end(id, userId);
  }
}
