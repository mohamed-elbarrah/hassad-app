import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { BackupTrigger } from "@prisma/client";
import {
  AdminBackupListQueryDto,
  CreateAdminBackupDto,
} from "../dto/admin-backups.dto";
import { AdminBackupsService } from "../services/admin-backups.service";

@Controller("admin/backups")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBackupsController {
  constructor(private readonly service: AdminBackupsService) {}

  @Get()
  @RequirePermissions("admin.backups.read")
  list(@Query() query: AdminBackupListQueryDto) {
    return this.service.listBackups(query);
  }

  @Get(":id")
  @RequirePermissions("admin.backups.read")
  get(@Param("id") id: string) {
    return this.service.getBackup(id);
  }

  @Get(":id/download-url")
  @RequirePermissions("admin.backups.manage")
  getDownloadUrl(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.service.getDownloadUrl(id, userId);
  }

  @Post()
  @RequirePermissions("admin.backups.manage")
  create(@Body() dto: CreateAdminBackupDto, @CurrentUser("id") userId: string) {
    return this.service.enqueueBackup(userId, dto.scope, BackupTrigger.MANUAL);
  }
}

/** Compatibility adapter for legacy Admin export/status consumers. */
@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminBackupsCompatibilityController {
  constructor(private readonly service: AdminBackupsService) {}

  @Get("exports/:type")
  @RequirePermissions("admin.backups.read")
  exportData(@Param("type") type: string) {
    return this.service.exportData(type);
  }

  @Post("backups/trigger")
  @RequirePermissions("admin.backups.manage")
  trigger(@CurrentUser("id") userId: string) {
    return this.service.triggerBackup(userId);
  }

  @Get("backups/status")
  @RequirePermissions("admin.backups.read")
  getStatus() {
    return this.service.getBackupStatus();
  }

  @Get("backups/history")
  @RequirePermissions("admin.backups.read")
  getHistory(@Query("limit") limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 20;
    return this.service.getBackupHistory(
      Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 100)
        : 20,
    );
  }
}
