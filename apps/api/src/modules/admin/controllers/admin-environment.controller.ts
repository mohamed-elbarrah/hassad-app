import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminEnvironmentService } from "../services/admin-environment.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/environment")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminEnvironmentController {
  constructor(private readonly service: AdminEnvironmentService) {}

  @Get()
  @RequirePermissions("admin.settings")
  getInfo() {
    return this.service.getInfo();
  }
}
