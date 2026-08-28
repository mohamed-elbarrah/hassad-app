import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AdminUsersService } from "../services/admin-users.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  JwtPayload,
} from "../../../common/decorators/current-user.decorator";
import {
  QueryUsersDto,
  BulkUserActionDto,
  ImpersonateDto,
  AssignPermissionsDto,
  ChangeRoleDto,
  CreateAdminUserDto,
  UpdateUserDto,
  QueryUserActivityDto,
  SuspendUserDto,
  ReactivateUserDto,
} from "../dto/admin-users.dto";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @RequirePermissions("admin.users.manage")
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Get()
  @RequirePermissions("admin.users.read")
  findAll(@Query() query: QueryUsersDto) {
    return this.adminUsersService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("admin.users.read")
  findOne(@Param("id") id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Get(":id/overview")
  @RequirePermissions("admin.users.read")
  getOverview(@Param("id") id: string) {
    return this.adminUsersService.getOverview(id);
  }

  @Get(":id/workspace")
  @RequirePermissions("admin.users.read")
  getWorkspace(@Param("id") id: string) {
    return this.adminUsersService.getWorkspace(id);
  }

  @Get(":id/performance")
  @RequirePermissions("admin.users.read")
  getPerformance(@Param("id") id: string) {
    return this.adminUsersService.getPerformance(id);
  }

  @Get(":id/permissions")
  @RequirePermissions("admin.users.read")
  getPermissions(
    @Param("id") id: string,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminUsersService.getPermissions(id, adminId);
  }

  @Get(":id/activity")
  @RequirePermissions("admin.users.read")
  getActivity(
    @Param("id") id: string,
    @Query() query: QueryUserActivityDto,
  ) {
    return this.adminUsersService.getActivity(id, query.page, query.limit);
  }

  @Get(":id/work")
  @RequirePermissions("admin.users.read")
  getWork(@Param("id") id: string) {
    return this.adminUsersService.getWork(id);
  }

  @Post("bulk")
  @RequirePermissions("admin.users.manage")
  bulkAction(@Body() dto: BulkUserActionDto) {
    return this.adminUsersService.bulkAction(dto);
  }

  @Post(":id/reset-password")
  @RequirePermissions("admin.users.manage")
  resetPassword(@Param("id") id: string) {
    return this.adminUsersService.resetPassword(id);
  }

  @Post(":id/impersonate")
  @RequirePermissions("admin.users.impersonate")
  async impersonate(
    @Param("id") id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: ImpersonateDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    const result = await this.adminUsersService.impersonate(
      admin.id,
      id,
      dto.reason,
      ip,
      userAgent,
    );
    const maxAge = Math.max(0, result.expiresAt.getTime() - Date.now());
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    res.cookie("token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    return { expiresAt: result.expiresAt.toISOString() };
  }

  @Post(":id/revoke-sessions")
  @RequirePermissions("admin.users.manage")
  revokeSessions(
    @Param("id") id: string,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminUsersService.revokeSessions(id, adminId);
  }

  @Post(":id/suspend")
  @RequirePermissions("admin.users.manage")
  suspend(
    @Param("id") id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminUsersService.suspend(id, dto.reason, adminId, dto.suspendedUntil);
  }

  @Post(":id/reactivate")
  @RequirePermissions("admin.users.manage")
  reactivate(
    @Param("id") id: string,
    @Body() dto: ReactivateUserDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminUsersService.reactivate(id, dto.reason, adminId);
  }

  @Patch(":id")
  @RequirePermissions("admin.users.manage")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.adminUsersService.update(id, dto);
  }

  @Post(":id/permissions")
  @RequirePermissions("admin.users.manage")
  setPermissions(
    @Param("id") id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser("id") adminId: string,
  ) {
    return this.adminUsersService.setPermissions(id, dto, adminId);
  }
}
