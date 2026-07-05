import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
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
} from "../dto/admin-users.dto";

@Controller("admin/users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

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

  @Get(":id/activity")
  @RequirePermissions("admin.users.read")
  getActivity(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminUsersService.getActivity(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
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
  impersonate(
    @Param("id") id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: ImpersonateDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    return this.adminUsersService.impersonate(
      admin.id,
      id,
      dto.reason,
      ip,
      userAgent,
    );
  }

  @Post(":id/revoke-sessions")
  @RequirePermissions("admin.users.manage")
  revokeSessions(@Param("id") id: string) {
    return this.adminUsersService.revokeSessions(id);
  }

  @Post(":id/permissions")
  @RequirePermissions("admin.users.manage")
  setPermissions(@Param("id") id: string, @Body() dto: AssignPermissionsDto) {
    return this.adminUsersService.setPermissions(id, dto);
  }
}
