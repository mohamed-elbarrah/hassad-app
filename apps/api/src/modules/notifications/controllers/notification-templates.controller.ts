import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { NotificationTemplatesService } from "../services/notification-templates.service";
import { UpdateNotificationTemplateDto } from "../dto/notification-template.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("notification-templates")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationTemplatesController {
  constructor(private readonly service: NotificationTemplatesService) {}

  @Get()
  @RequirePermissions("notification-templates.read")
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  @RequirePermissions("notification-templates.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Put(":id")
  @RequirePermissions("notification-templates.update")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateNotificationTemplateDto,
  ) {
    return this.service.update(id, dto);
  }
}
