import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import {
  AdminClientsWorkspaceQueryDto,
  AdminCrmWorkspaceQueryDto,
  AdminDeliveryWorkspaceQueryDto,
  AdminEmployeesWorkspaceQueryDto,
  AdminOverviewWorkspaceQueryDto,
} from "../dto/admin-workspaces.dto";
import { AdminWorkspacesService } from "../services/admin-workspaces.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminWorkspacesController {
  constructor(private readonly service: AdminWorkspacesService) {}

  @Get("overview")
  @RequirePermissions("admin.dashboard")
  getOverview(@Query() query: AdminOverviewWorkspaceQueryDto) {
    return this.service.getOverview(query);
  }

  @Get("employees/workspace")
  @RequirePermissions("admin.users.read")
  getEmployeesWorkspace(@Query() query: AdminEmployeesWorkspaceQueryDto) {
    return this.service.getEmployeesWorkspace(query);
  }

  @Get("users/workspace")
  @RequirePermissions("admin.users.read")
  getEmployeesWorkspaceLegacy(@Query() query: AdminEmployeesWorkspaceQueryDto) {
    return this.getEmployeesWorkspace(query);
  }

  @Get("clients/workspace")
  @RequirePermissions("admin.clients.read")
  getClientsWorkspace(@Query() query: AdminClientsWorkspaceQueryDto) {
    return this.service.getClientsWorkspace(query);
  }

  @Get("crm/workspace")
  @RequirePermissions("admin.requests.read")
  getCrmWorkspace(@Query() query: AdminCrmWorkspaceQueryDto) {
    return this.service.getCrmWorkspace(query);
  }

  @Get("projects/workspace")
  @RequirePermissions("admin.projects.read")
  getDeliveryWorkspace(@Query() query: AdminDeliveryWorkspaceQueryDto) {
    return this.service.getDeliveryWorkspace(query);
  }

  @Get("delivery/workspace")
  @RequirePermissions("admin.projects.read")
  getDeliveryWorkspaceLegacy(@Query() query: AdminDeliveryWorkspaceQueryDto) {
    return this.service.getDeliveryWorkspace(query);
  }
}
