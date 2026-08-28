import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { AdminContractsService } from "../services/admin-contracts.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { AdminContractActionDto, AdminContractsQueryDto, AdminContractStatusDto, ConvertToProjectDto } from "../dto/admin-contracts.dto";

@Controller("admin/contracts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminContractsController {
  constructor(private readonly service: AdminContractsService) {}

  @Get()
  @RequirePermissions("admin.contracts.read")
  findAll(@Query() query: AdminContractsQueryDto) { return this.service.findAll(query); }

  /** Capabilities describe the authenticated admin actor, not a contract resource. */
  @Get("capabilities")
  @RequirePermissions("admin.contracts.read")
  getActorCapabilities(@CurrentUser("id") userId: string) {
    return this.service.getActorCapabilities(userId);
  }

  @Get(":id/file")
  @RequirePermissions("admin.contracts.read")
  getFileUrl(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.getFileUrl(id);
  }

  @Get(":id")
  @RequirePermissions("admin.contracts.read")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) { return this.service.findOne(id); }

  @Post(":id/status")
  @RequirePermissions("admin.contracts.intervene")
  updateStatus(@Param("id", new ParseUUIDPipe()) id: string, @CurrentUser("id") adminId: string, @Body() dto: AdminContractStatusDto) {
    return this.service.updateStatus(id, adminId, dto.status, dto.reason);
  }

  @Post(":id/cancel")
  @RequirePermissions("admin.contracts.intervene")
  cancel(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: AdminContractActionDto, @CurrentUser("id") adminId: string) {
    return this.service.cancel(id, dto.reason, adminId);
  }

  @Post(":id/trigger-renewal-alert")
  @RequirePermissions("admin.contracts.intervene")
  triggerRenewalAlert(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.triggerRenewalAlert(id, adminId);
  }

  @Post(":id/convert-to-project")
  @RequirePermissions("admin.contracts.intervene")
  convertToProject(@Param("id", new ParseUUIDPipe()) id: string, @CurrentUser("id") adminId: string, @Body() dto: ConvertToProjectDto) {
    return this.service.convertToProject(id, adminId, dto);
  }
}
