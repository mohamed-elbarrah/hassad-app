import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminClientsService } from "../services/admin-clients.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  SuspendClientDto,
  ReactivateClientDto,
  AssignManagerDto,
} from "../dto/admin-clients.dto";

@Controller("admin/clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminClientsController {
  constructor(private readonly service: AdminClientsService) {}

  @Get()
  @RequirePermissions("admin.clients.read")
  findAll(@Query() q: any) {
    return this.service.findAll(q);
  }

  @Get("stats")
  @RequirePermissions("admin.clients.read")
  stats() {
    return this.service.getStats();
  }

  @Get(":id")
  @RequirePermissions("admin.clients.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/full")
  @RequirePermissions("admin.clients.read")
  getFull(@Param("id") id: string) {
    return this.service.getFull(id);
  }

  @Get(":id/history")
  @RequirePermissions("admin.clients.read")
  getHistory(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getHistory(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post(":id/suspend")
  @RequirePermissions("admin.clients.intervene")
  suspend(
    @Param("id") id: string,
    @Body() dto: SuspendClientDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.suspend(id, dto.reason, adminId, dto.suspendedUntil);
  }

  @Post(":id/reactivate")
  @RequirePermissions("admin.clients.intervene")
  reactivate(
    @Param("id") id: string,
    @Body() dto: ReactivateClientDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.reactivate(id, dto.reason, adminId);
  }

  @Post(":id/assign-manager")
  @RequirePermissions("admin.clients.intervene")
  assignManager(
    @Param("id") id: string,
    @Body() dto: AssignManagerDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.assignManager(
      id,
      dto.accountManagerId,
      dto.reason,
      adminId,
    );
  }
}
