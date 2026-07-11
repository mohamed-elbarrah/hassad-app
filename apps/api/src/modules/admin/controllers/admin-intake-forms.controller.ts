import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminPortalService } from "../services/admin-portal.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/portal/intake-forms")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminIntakeFormsController {
  constructor(private readonly service: AdminPortalService) {}

  @Get()
  @RequirePermissions("admin.portal")
  getIntakeForms(@Query() query: any) {
    return this.service.getIntakeForms(query);
  }
}
