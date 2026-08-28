import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AdminRequestsService } from "../services/admin-requests.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { StaleQueryDto } from "../dto/admin-query.dto";
import {
  AdminRequestContactLogDto,
  AdminRequestForceStatusDto,
  AdminRequestIdParamDto,
  AdminRequestNotesDto,
  AdminRequestQueryDto,
  AdminRequestReassignDto,
} from "../dto/admin-requests.dto";

@Controller("admin/requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRequestsController {
  constructor(private readonly service: AdminRequestsService) {}

  @Get()
  @RequirePermissions("admin.requests.read")
  findAll(@Query() query: AdminRequestQueryDto) { return this.service.findAll(query); }

  @Get("stale")
  @RequirePermissions("admin.requests.read")
  getStale(@Query() query: StaleQueryDto) { return this.service.getStaleRequests(query.days, query.page, query.limit); }

  @Get(":id")
  @RequirePermissions("admin.requests.read")
  findOne(@Param() params: AdminRequestIdParamDto, @CurrentUser("id") adminId: string) {
    return this.service.findOne(params.id, adminId);
  }

  @Post(":id/reassign")
  @RequirePermissions("admin.requests.intervene")
  reassign(@Param() params: AdminRequestIdParamDto, @Body() dto: AdminRequestReassignDto, @CurrentUser("id") adminId: string) {
    return this.service.reassign(params.id, dto.assigneeId, adminId, dto.reason);
  }

  @Post(":id/force-status")
  @RequirePermissions("admin.requests.intervene")
  forceStatus(@Param() params: AdminRequestIdParamDto, @Body() dto: AdminRequestForceStatusDto, @CurrentUser("id") adminId: string) {
    return this.service.forceStatus(params.id, dto.status, dto.reason, adminId);
  }

  @Post(":id/contact-log")
  @RequirePermissions("admin.requests.intervene")
  addContactLog(@Param() params: AdminRequestIdParamDto, @Body() dto: AdminRequestContactLogDto, @CurrentUser("id") adminId: string) {
    return this.service.addContactLog(params.id, adminId, dto);
  }

  @Patch(":id/notes")
  @RequirePermissions("admin.requests.intervene")
  updateNotes(@Param() params: AdminRequestIdParamDto, @Body() dto: AdminRequestNotesDto, @CurrentUser("id") adminId: string) {
    return this.service.updateNotes(params.id, dto.notes, adminId);
  }
}
