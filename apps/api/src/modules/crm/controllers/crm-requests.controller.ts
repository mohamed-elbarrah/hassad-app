import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { CrmCreateRequestIntakeDto } from "../dto/crm-requests.dto";
import { RequestsService } from "../../requests/requests.service";

@Controller("crm/requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post("intake")
  @RequirePermissions("leads.create", "clients.create")
  createIntake(
    @CurrentUser("id") userId: string,
    @Body() dto: CrmCreateRequestIntakeDto,
  ) {
    return this.requestsService.createCrmIntake(userId, dto);
  }
}
