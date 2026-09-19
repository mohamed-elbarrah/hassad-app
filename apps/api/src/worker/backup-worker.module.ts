import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageModule } from "../common/storage/storage.module";
import { AdminActionLogService } from "../modules/admin/services/admin-action-log.service";
import { AdminBackupsService } from "../modules/admin/services/admin-backups.service";
import { AdminBackupScheduler } from "../modules/admin/schedulers/admin-backup.scheduler";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
  ],
  providers: [
    AdminActionLogService,
    AdminBackupsService,
    AdminBackupScheduler,
  ],
})
export class BackupWorkerModule {}
