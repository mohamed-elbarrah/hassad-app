import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminAuditService } from "../services/admin-audit.service";
import { AuditLogQueryDto } from "../dto/admin.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/audit-log")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  @RequirePermissions("admin.audit")
  getAuditLog(@Query() query: AuditLogQueryDto) {
    return this.auditService.getAuditLog(query);
  }

  @Get("filters")
  @RequirePermissions("admin.audit")
  getFilterOptions() {
    return this.auditService.getFilterOptions();
  }
}
