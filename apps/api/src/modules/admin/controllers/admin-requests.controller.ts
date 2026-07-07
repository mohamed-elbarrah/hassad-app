import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminRequestsService } from "../services/admin-requests.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRequestsController {
  constructor(private readonly service: AdminRequestsService) {}

  @Get() @RequirePermissions("admin.requests.read") findAll(@Query() q: any) {
    return this.service.findAll(q);
  }
  @Get(":id") @RequirePermissions("admin.requests.read") findOne(
    @Param("id") id: string,
  ) {
    return this.service.findOne(id);
  }
  @Post(":id/reassign")
  @RequirePermissions("admin.requests.intervene")
  reassign(@Param("id") id: string, @Body("assigneeId") assigneeId: string) {
    return this.service.reassign(id, assigneeId);
  }
  @Post(":id/force-status")
  @RequirePermissions("admin.requests.intervene")
  forceStatus(@Param("id") id: string, @Body() body: any) {
    return this.service.forceStatus(id, body.status, body.reason);
  }
  @Patch(":id/notes")
  @RequirePermissions("admin.requests.intervene")
  updateNotes(@Param("id") id: string, @Body("notes") notes: string) {
    return this.service.updateNotes(id, notes);
  }
}
