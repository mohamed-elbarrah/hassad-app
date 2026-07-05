import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminLeadsService } from "../services/admin-leads.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

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
}
