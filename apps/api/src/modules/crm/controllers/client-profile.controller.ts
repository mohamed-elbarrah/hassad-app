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
import { ClientProfileService } from "../services/client-profile.service";
import { UpsertClientProfileDto } from "../dto/client-profile.dto";

@Controller("clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientProfileController {
  constructor(private readonly profileService: ClientProfileService) {}

  @Get(":id/profile")
  async getProfile(@Param("id") id: string, @Req() req: any) {
    return this.profileService.getByClientId(id, req.user);
  }

  @Get(":id/team-view")
  async getTeamView(@Param("id") id: string) {
    return this.profileService.getTeamView(id);
  }

  @Put(":id/profile")
  async upsertProfile(
    @Param("id") id: string,
    @Body() dto: UpsertClientProfileDto,
    @Req() req: any,
  ) {
    return this.profileService.upsert(id, dto, req.user);
  }

  @Delete(":id/profile")
  @RequirePermissions("clients.update")
  async deleteProfile(@Param("id") id: string) {
    return this.profileService.delete(id);
  }
}
