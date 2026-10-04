import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { PmMarketingStrategiesService } from "../services/pm-marketing-strategies.service";

@Controller("pm/marketing-strategies")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PmMarketingStrategiesController {
  constructor(private readonly service: PmMarketingStrategiesService) {}

  @Get("by-task/:taskId")
  @RequirePermissions("tasks.read")
  byTask(@CurrentUser("id") userId: string, @Param("taskId") taskId: string) {
    return this.service.byTask(userId, taskId);
  }

  @Get(":id")
  @RequirePermissions("tasks.read")
  detail(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.detail(userId, id);
  }

  @Get(":id/download")
  @RequirePermissions("tasks.read")
  download(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.download(userId, id);
  }

  @Post(":id/approve-client")
  @RequirePermissions("tasks.approve")
  approveForClient(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.approveForClient(userId, id);
  }

  @Post(":id/request-revision")
  @RequirePermissions("tasks.approve")
  requestRevision(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body("comment") comment: string,
  ) {
    return this.service.requestRevision(userId, id, comment);
  }
}
