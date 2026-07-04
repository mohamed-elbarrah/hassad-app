import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AdminAutomationService } from "../services/admin-automation.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/automation")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAutomationController {
  constructor(private readonly service: AdminAutomationService) {}

  @Get("rules") @RequirePermissions("admin.settings")
  findAll() { return this.service.findAll(); }

  @Get("rules/:id") @RequirePermissions("admin.settings")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @Post("rules") @RequirePermissions("admin.settings")
  create(@Body() body: any) { return this.service.create(body); }

  @Patch("rules/:id") @RequirePermissions("admin.settings")
  update(@Param("id") id: string, @Body() body: any) { return this.service.update(id, body); }

  @Delete("rules/:id") @RequirePermissions("admin.settings")
  remove(@Param("id") id: string) { return this.service.remove(id); }

  @Get("logs") @RequirePermissions("admin.settings")
  getLogs(@Query("ruleId") ruleId?: string) { return this.service.getLogs(ruleId); }
}
