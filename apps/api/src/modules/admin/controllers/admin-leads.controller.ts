import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { AdminLeadsService } from "../services/admin-leads.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { JwtPayload } from "../../../common/decorators/current-user.decorator";
import { ForceLeadStageDto, StaleQueryDto } from "../dto/admin-leads.dto";

@Controller("admin/leads")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminLeadsController {
  constructor(private readonly service: AdminLeadsService) {}

  @Get() @RequirePermissions("admin.leads.read") findAll(@Query() q: any) {
    return this.service.findAll(q);
  }
  @Get("stats") @RequirePermissions("admin.leads.read") getStats() {
    return this.service.getStats();
  }
  @Get("stale") @RequirePermissions("admin.leads.read") getStale(
    @Query() q: StaleQueryDto,
  ) {
    return this.service.getStaleLeads(q.days, q.page, q.limit);
  }
  @Get(":id") @RequirePermissions("admin.leads.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }
  @Post(":id/reassign") @RequirePermissions("admin.leads.intervene") reassign(
    @Param("id") id: string,
    @Body("assigneeId") assigneeId: string,
    @Body("reason") reason: string,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.reassign(id, assigneeId, adminId, reason);
  }
  @Post(":id/contact-log")
  @RequirePermissions("admin.leads.intervene")
  addContactLog(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { type: string; result: string; notes?: string; contactedAt?: string },
  ) {
    return this.service.addContactLog(id, user.id, body);
  }
  @Post(":id/convert-to-client")
  @RequirePermissions("admin.leads.intervene")
  convertToClient(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body("additionalNotes") additionalNotes?: string,
  ) {
    return this.service.convertToClient(id, user.id, additionalNotes);
  }
  @Post(":id/force-stage")
  @RequirePermissions("admin.leads.intervene")
  forceStage(
    @Param("id") id: string,
    @Body() dto: ForceLeadStageDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.service.forceStage(id, dto.stage as any, dto.reason, adminId);
  }
}
