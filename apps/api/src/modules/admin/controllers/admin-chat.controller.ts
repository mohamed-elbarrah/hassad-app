import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { AdminChatService } from "../services/admin-chat.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/conversations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminChatController {
  constructor(private readonly service: AdminChatService) {}

  @Get() @RequirePermissions("admin.chat.read") findAll(@Query() q: any) {
    return this.service.findAllConversations(q);
  }
  @Get(":id/messages") @RequirePermissions("admin.chat.read") getMessages(
    @Param("id") id: string,
    @Query() q: any,
  ) {
    return this.service.getMessages(id, q);
  }
  @Post(":id/hide") @RequirePermissions("admin.chat.moderate") hide(
    @Param("id") id: string,
  ) {
    return this.service.hideConversation(id);
  }
}
