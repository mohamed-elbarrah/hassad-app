import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminService } from "../services/admin.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  @RequirePermissions("admin.stats")
  getStats() {
    return this.adminService.getStats();
  }

  @Get("health")
  @RequirePermissions("admin.stats")
  getHealth() {
    return this.adminService.getHealth();
  }
}
