import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminSessionsService } from "../services/admin-sessions.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { QuerySessionsDto } from "../dto/admin-sessions.dto";

@Controller("admin/sessions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSessionsController {
  constructor(
    private readonly adminSessionsService: AdminSessionsService,
  ) {}

  @Get()
  @RequirePermissions("admin.sessions.read")
  findAll(@Query() query: QuerySessionsDto) {
    return this.adminSessionsService.findAll(query);
  }

  @Post(":id/revoke")
  @RequirePermissions("admin.users.manage")
  revoke(@Param("id") id: string) {
    return this.adminSessionsService.revoke(id);
  }
}
