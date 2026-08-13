import { Controller, Get, Param, Post, Body, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { CrmOrdersService } from "../services/crm-orders.service";

@Controller("crm/orders")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmOrdersController {
  constructor(private readonly service: CrmOrdersService) {}

  @Get(":id")
  @RequirePermissions("leads.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post(":id/notes")
  @RequirePermissions("leads.update")
  addNote(
    @Param("id") id: string,
    @CurrentUser("id") authorId: string,
    @Body("content") content: string,
  ) {
    return this.service.createNote(id, authorId, content);
  }
}
