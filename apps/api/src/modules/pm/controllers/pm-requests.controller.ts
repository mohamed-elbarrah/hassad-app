import { Controller, Get, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PmRequestsService } from "../services/pm-requests.service";

@Controller("pm/requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PmRequestsController {
  constructor(private readonly service: PmRequestsService) {}

  @Get()
  @RequirePermissions("projects.read")
  list(@CurrentUser("id") userId: string) {
    return this.service.list(userId);
  }
}
