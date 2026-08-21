import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ClientsService } from "../crm/services/clients.service";
import { ClientProfileService } from "../crm/services/client-profile.service";
import {
  UpsertClientProfileDto,
  UpsertClientProfileV2Dto,
} from "../crm/dto/client-profile.dto";
import { SalesClientQueryDto } from "./dto/sales-query.dto";

type AuthUser = {
  id: string;
  role: string;
  permissions?: string[];
};

@Controller("sales/clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("clients.read")
export class SalesClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly profileService: ClientProfileService,
  ) {}

  @Get()
  findAll(@Query() filters: SalesClientQueryDto) {
    return this.clientsService.findAllForSales(filters);
  }

  @Get(":id/profile/v2")
  getProfileV2(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.profileService.getByClientId(id, user);
  }

  @Get(":id/profile")
  getProfile(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.profileService.getByClientId(id, user);
  }

  @Put(":id/profile/v2")
  @RequirePermissions("clients.update")
  upsertProfileV2(
    @Param("id") id: string,
    @Body() dto: UpsertClientProfileV2Dto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.profileService.upsertV2(id, dto, user);
  }

  @Put(":id/profile")
  @RequirePermissions("clients.update")
  upsertProfile(
    @Param("id") id: string,
    @Body() dto: UpsertClientProfileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.profileService.upsert(id, dto, user);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.clientsService.findOneForSales(id);
  }
}
