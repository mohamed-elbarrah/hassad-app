import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { ClientProfileService } from "../services/client-profile.service";
import {
  UpsertClientProfileDto,
  UpsertClientProfileV2Dto,
} from "../dto/client-profile.dto";

@Controller("clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientProfileController {
  constructor(private readonly profileService: ClientProfileService) {}

  @Get(":id/profile")
  async getProfile(@Param("id") id: string, @Req() req: any) {
    return this.profileService.getByClientId(id, req.user);
  }

  /**
   * V2: Get client profile with unified IntakeFormV2 data structure
   * Returns the same data as GET /clients/:id/profile but explicitly
   * typed for V2 consumers.
   */
  @Get(":id/profile/v2")
  async getProfileV2(@Param("id") id: string, @Req() req: any) {
    return this.profileService.getByClientId(id, req.user);
  }

  @Get(":id/team-view")
  @RequirePermissions("clients.read")
  async getTeamView(@Param("id") id: string, @CurrentUser() user: any) {
    return this.profileService.getTeamView(id, user);
  }

  @Put(":id/profile")
  async upsertProfile(
    @Param("id") id: string,
    @Body() dto: UpsertClientProfileDto,
    @Req() req: any,
  ) {
    return this.profileService.upsert(id, dto, req.user);
  }

  /**
   * V2: Upsert client profile with unified IntakeFormV2 data structure
   * This endpoint accepts the same JSON structure as IntakeFormV2 steps.
   * Used by portal profile edit page to update client info.
   */
  @Put(":id/profile/v2")
  async upsertProfileV2(
    @Param("id") id: string,
    @Body() dto: UpsertClientProfileV2Dto,
    @Req() req: any,
  ) {
    return this.profileService.upsertV2(id, dto, req.user);
  }

  @Delete(":id/profile")
  @RequirePermissions("clients.update")
  async deleteProfile(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.profileService.delete(id, userId);
  }
}
