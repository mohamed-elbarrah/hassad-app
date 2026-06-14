import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminController } from "./controllers/admin.controller";
import { AdminAuditController } from "./controllers/admin-audit.controller";
import { AdminSettingsController } from "./controllers/admin-settings.controller";
import { AdminService } from "./services/admin.service";
import { AdminAuditService } from "./services/admin-audit.service";
import { AdminSettingsService } from "./services/admin-settings.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AdminAuditController, AdminSettingsController],
  providers: [AdminService, AdminAuditService, AdminSettingsService],
  exports: [AdminAuditService, AdminSettingsService],
})
export class AdminModule {}
