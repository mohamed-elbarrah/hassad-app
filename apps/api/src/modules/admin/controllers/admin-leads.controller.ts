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
  @Get(":id") @RequirePermissions("admin.leads.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }
  @Post(":id/reassign") @RequirePermissions("admin.leads.read") reassign(
    @Param("id") id: string,
    @Body("assigneeId") assigneeId: string,
  ) {
    return this.service.reassign(id, assigneeId);
  }
  @Post(":id/contact-log")
  @RequirePermissions("admin.leads.read")
  addContactLog(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { type: string; result: string; notes?: string; contactedAt?: string },
  ) {
    return this.service.addContactLog(id, user.id, body);
  }
  @Post(":id/convert-to-client")
  @RequirePermissions("admin.leads.read")
  convertToClient(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body("additionalNotes") additionalNotes?: string,
  ) {
    return this.service.convertToClient(id, user.id, additionalNotes);
  }
}
