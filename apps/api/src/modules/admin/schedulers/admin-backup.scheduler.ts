import { Injectable, Logger } from "@nestjs/common";
import { Cron, Interval } from "@nestjs/schedule";
import { hostname } from "os";
import { BackupScope, BackupTrigger } from "@prisma/client";
import { AdminBackupsService } from "../services/admin-backups.service";

@Injectable()
export class AdminBackupScheduler {
  private readonly logger = new Logger(AdminBackupScheduler.name);
  private readonly workerId = `${hostname()}:${process.pid}`;
  private processing = false;

  constructor(private readonly backups: AdminBackupsService) {}

  @Cron("0 2 * * *", { name: "admin-daily-backup", timeZone: "UTC" })
  async enqueueDailyBackup(): Promise<void> {
    try {
      await this.backups.enqueueBackup(
        undefined,
        BackupScope.FULL_SYSTEM,
        BackupTrigger.SCHEDULED,
      );
    } catch (error) {
      this.logger.warn(
        `Daily backup was not queued: ${error instanceof Error ? error.message : "BACKUP_QUEUE_FAILED"}`,
      );
    }
  }

  @Cron("15 2 * * *", { name: "admin-backup-retention", timeZone: "UTC" })
  async applyRetention(): Promise<void> {
    await this.backups.expireBackups();
  }

  @Cron("*/5 * * * *", { name: "admin-backup-restore-target-cleanup", timeZone: "UTC" })
  async cleanupRestoreTargets(): Promise<void> {
    await this.backups.cleanupRestoreTargets();
  }

  @Cron("*/5 * * * *", { name: "admin-backup-stale-recovery", timeZone: "UTC" })
  async recoverStaleOperations(): Promise<void> {
    await this.backups.recoverStaleOperations();
  }

  @Cron("30 * * * *", { name: "admin-backup-failed-artifact-cleanup", timeZone: "UTC" })
  async cleanupFailedBackupArtifacts(): Promise<void> {
    await this.backups.cleanupFailedBackupArtifacts();
  }

  @Interval(5000)
  async processQueuedBackup(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.backups.processNextOperation(this.workerId);
    } catch (error) {
      this.logger.error(
        `Backup worker failure: ${error instanceof Error ? error.message : "BACKUP_WORKER_FAILED"}`,
      );
    } finally {
      this.processing = false;
    }
  }
}
