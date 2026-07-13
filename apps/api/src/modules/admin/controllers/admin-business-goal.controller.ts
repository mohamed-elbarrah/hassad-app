import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from "@nestjs/common";
import { AdminBusinessGoalService } from "../services/admin-business-goal.service";
import { CreateBusinessGoalDto, UpdateBusinessGoalDto } from "../dto/admin-business-goal.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/business-goals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBusinessGoalController {
  constructor(private readonly service: AdminBusinessGoalService) {}

  @Get()
  @RequirePermissions("admin.business_goals.read")
  findAll(@Query("metric") metric?: string) {
    return this.service.findAll(metric);
  }

  @Get(":id")
  @RequirePermissions("admin.business_goals.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("admin.business_goals.create")
  create(@Body() dto: CreateBusinessGoalDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("admin.business_goals.update")
  update(@Param("id") id: string, @Body() dto: UpdateBusinessGoalDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("admin.business_goals.delete")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
