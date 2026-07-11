import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminMarketingService } from "../services/admin-marketing.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

@Controller("admin/marketing/strategies")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminMarketingController {
  constructor(private readonly service: AdminMarketingService) {}

  @Get()
  @RequirePermissions("admin.marketing")
  getStrategies(@Query() query: any) {
    return this.service.getStrategies(query);
  }

  @Patch(":id/status")
  @RequirePermissions("admin.marketing")
  updateStrategyStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("note") note: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.service.updateStrategyStatus(id, status, user.id, note);
  }
}
