import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  BackupOperationStatus,
  BackupOperationType,
  BackupScope,
  BackupStatus,
  BackupTrigger,
  Prisma,
} from "@prisma/client";
import { createHash } from "crypto";
import { createReadStream } from "fs";
import { mkdtemp, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import { lookup } from "dns/promises";
import { join } from "path";
import { spawn } from "child_process";
import { once } from "events";
import { StorageService } from "../../../common/storage/storage.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { AdminActionLogService } from "./admin-action-log.service";
import { AdminBackupListQueryDto } from "../dto/admin-backups.dto";

const BACKUP_RETENTION_DAYS = 30;
const BACKUP_PREFIX = "backups/";
const BACKUP_TOOL_UNAVAILABLE = "BACKUP_TOOL_UNAVAILABLE";
const BACKUP_LEASE_MS = 2 * 60 * 1000;
const BACKUP_FILE_COPY_CONCURRENCY = 8;

@Injectable()
export class AdminBackupsService {
  private readonly logger = new Logger(AdminBackupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly actionLog: AdminActionLogService,
  ) {}

  async enqueueBackup(
    requestedById: string | undefined,
    scope: BackupScope,
    trigger: BackupTrigger,
  ) {
    const { backup, operation } = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext('hassad_backup_enqueue'))`,
      );
      const activeOperation = await tx.backupOperation.findFirst({
        where: {
          type: {
            in: [BackupOperationType.CREATE, BackupOperationType.RESTORE],
          },
          status: {
            in: [BackupOperationStatus.QUEUED, BackupOperationStatus.RUNNING],
          },
        },
        select: { id: true },
      });

      if (activeOperation) {
        throw new ConflictException({
          code: "BACKUP_ALREADY_RUNNING",
          details: { operationId: activeOperation.id },
        });
      }

      const createdBackup = await tx.backup.create({
        data: {
          scope,
          trigger,
          status: BackupStatus.QUEUED,
          createdById: requestedById,
          expiresAt: this.retentionDate(),
        },
        select: {
          id: true,
          scope: true,
          trigger: true,
          status: true,
          createdAt: true,
        },
      });

      const createdOperation = await tx.backupOperation.create({
        data: {
          backupId: createdBackup.id,
          type: BackupOperationType.CREATE,
          requestedById,
        },
        select: { id: true, status: true },
      });

      return { backup: createdBackup, operation: createdOperation };
    });

    if (requestedById) {
      await this.actionLog.record({
        actorId: requestedById,
        targetType: "backup",
        targetId: backup.id,
        actionType: "backup.create_requested",
        afterState: { scope, trigger, operationId: operation.id },
      });
    }

    return { backup, operation };
  }

  async enqueueRestoreVerification(
    backupId: string,
    requestedById: string,
  ) {
    const { backup, operation } = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext('hassad_backup_enqueue'))`,
      );
      const backup = await tx.backup.findUnique({
        where: { id: backupId },
        select: {
          id: true,
          scope: true,
          status: true,
          databaseKey: true,
          checksum: true,
        },
      });
      if (!backup) {
        throw new NotFoundException({
          code: "BACKUP_NOT_FOUND",
          details: { id: backupId },
        });
      }
      if (
        backup.scope !== BackupScope.DATABASE_ONLY ||
        backup.status !== BackupStatus.COMPLETED ||
        !backup.databaseKey
      ) {
        throw new ConflictException({
          code: "BACKUP_RESTORE_NOT_AVAILABLE",
          details: { status: backup.status, scope: backup.scope },
        });
      }
      if (!backup.checksum) {
        throw new ConflictException({
          code: "BACKUP_RESTORE_CHECKSUM_UNAVAILABLE",
          details: {},
        });
      }
      const activeOperation = await tx.backupOperation.findFirst({
        where: {
          type: {
            in: [BackupOperationType.CREATE, BackupOperationType.RESTORE],
          },
          status: {
            in: [BackupOperationStatus.QUEUED, BackupOperationStatus.RUNNING],
          },
        },
        select: { id: true, type: true },
      });
      if (activeOperation) {
        throw new ConflictException({
          code:
            activeOperation.type === BackupOperationType.RESTORE
              ? "BACKUP_RESTORE_ALREADY_RUNNING"
              : "BACKUP_ALREADY_RUNNING",
          details: { operationId: activeOperation.id },
        });
      }
      const operation = await tx.backupOperation.create({
        data: {
          backupId,
          type: BackupOperationType.RESTORE,
          status: BackupOperationStatus.QUEUED,
          requestedById,
        },
        select: { id: true, status: true },
      });
      return { backup, operation };
    });

    await this.actionLog.record({
      actorId: requestedById,
      targetType: "backup",
      targetId: backup.id,
      actionType: "backup.restore_verification_requested",
      afterState: { operationId: operation.id },
    });
    return { backup: { id: backup.id, status: backup.status }, operation };
  }

  async exportData(type: string): Promise<string> {
    switch (type) {
      case "users":
        return this.toCsv(
          await this.prisma.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          }),
          ["id", "name", "email", "isActive", "createdAt"],
        );
      case "clients": {
        const clients = await this.prisma.client.findMany({
          select: {
            id: true,
            companyName: true,
            businessName: true,
            user: {
              select: {
                name: true,
                email: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        });
        return this.toCsv(
          clients.map((client) => ({
            id: client.id,
            name: client.user?.name ?? "",
            email: client.user?.email ?? "",
            companyName: client.companyName ?? client.businessName ?? "",
            isActive: client.user?.isActive ?? false,
            createdAt: client.user?.createdAt ?? "",
          })),
          ["id", "name", "email", "companyName", "isActive", "createdAt"],
        );
      }
      case "invoices": {
        const invoices = await this.prisma.invoice.findMany({
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true,
            createdAt: true,
            client: { select: { companyName: true } },
          },
        });
        return this.toCsv(
          invoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            client: invoice.client?.companyName ?? "",
            amount: invoice.amount,
            status: invoice.status,
            dueDate: invoice.dueDate,
            createdAt: invoice.createdAt,
          })),
          [
            "id",
            "invoiceNumber",
            "client",
            "amount",
            "status",
            "dueDate",
            "createdAt",
          ],
        );
      }
      case "audit-log": {
        const logs = await this.prisma.ledger.findMany({
          take: 1000,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            entity: true,
            entityId: true,
            userId: true,
            createdAt: true,
          },
        });
        return this.toCsv(logs, [
          "id",
          "action",
          "entity",
          "entityId",
          "userId",
          "createdAt",
        ]);
      }
      case "requests": {
        const requests = await this.prisma.request.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phoneWhatsapp: true,
            status: true,
            source: true,
            createdAt: true,
            assignee: { select: { name: true } },
          },
        });
        return this.toCsv(
          requests.map((request) => ({
            id: request.id,
            companyName: request.companyName,
            contactName: request.contactName,
            email: request.email ?? "",
            phone: request.phoneWhatsapp ?? "",
            pipelineStage: request.status,
            source: request.source,
            assignee: request.assignee?.name ?? "",
            createdAt: request.createdAt.toISOString(),
          })),
          [
            "id",
            "companyName",
            "contactName",
            "email",
            "phone",
            "pipelineStage",
            "source",
            "assignee",
            "createdAt",
          ],
        );
      }
      case "contracts": {
        const contracts = await this.prisma.contract.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            totalValue: true,
            monthlyValue: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            client: { select: { companyName: true } },
          },
        });
        return this.toCsv(
          contracts.map((contract) => ({
            id: contract.id,
            title: contract.title,
            client: contract.client?.companyName ?? "",
            type: contract.type,
            status: contract.status,
            totalValue: contract.totalValue,
            monthlyValue: contract.monthlyValue,
            startDate: contract.startDate?.toISOString() ?? "",
            endDate: contract.endDate?.toISOString() ?? "",
            createdAt: contract.createdAt.toISOString(),
          })),
          [
            "id",
            "title",
            "client",
            "type",
            "status",
            "totalValue",
            "monthlyValue",
            "startDate",
            "endDate",
            "createdAt",
          ],
        );
      }
      case "tasks": {
        const tasks = await this.prisma.task.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            revisionCount: true,
            createdAt: true,
            project: { select: { name: true } },
            assignee: { select: { name: true } },
          },
        });
        return this.toCsv(
          tasks.map((task) => ({
            id: task.id,
            title: task.title,
            project: task.project?.name ?? "",
            assignee: task.assignee?.name ?? "",
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate?.toISOString() ?? "",
            revisionCount: task.revisionCount,
            createdAt: task.createdAt.toISOString(),
          })),
          [
            "id",
            "title",
            "project",
            "assignee",
            "status",
            "priority",
            "dueDate",
            "revisionCount",
            "createdAt",
          ],
        );
      }
      default:
        throw new BadRequestException({
          code: "UNSUPPORTED_EXPORT_TYPE",
          details: { type },
        });
    }
  }

  async triggerBackup(triggeredBy: string) {
    return this.enqueueBackup(
      triggeredBy,
      BackupScope.DATABASE_ONLY,
      BackupTrigger.MANUAL,
    );
  }

  async getBackupStatus() {
    const [latest, completedCount, failedCount, inProgress] = await Promise.all(
      [
        this.prisma.backup.findFirst({
          where: {
            status: { in: [BackupStatus.COMPLETED, BackupStatus.FAILED] },
          },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.backup.count({ where: { status: BackupStatus.COMPLETED } }),
        this.prisma.backup.count({ where: { status: BackupStatus.FAILED } }),
        this.prisma.backup.count({
          where: {
            status: { in: [BackupStatus.QUEUED, BackupStatus.RUNNING] },
          },
        }),
      ],
    );
    return {
      lastBackup: latest
        ? {
            status:
              latest.status === BackupStatus.COMPLETED ? "completed" : "failed",
            timestamp: latest.createdAt.toISOString(),
            id: latest.id,
            errorCode: latest.errorCode,
          }
        : null,
      stats: {
        totalCompleted: completedCount,
        totalFailed: failedCount,
        inProgress,
      },
    };
  }

  async getBackupHistory(limit = 20) {
    const result = await this.listBackups({ page: 1, limit });
    return result.items;
  }

  private toCsv<T extends object>(data: T[], fields: string[]): string {
    const rows = data.map((item) => {
      const row = item as Record<string, unknown>;
      return fields
        .map((field) => {
          const value = row[field];
          if (value === null || value === undefined) return "";
          const text = String(value);
          return text.includes(",") || text.includes('"') || text.includes("\n")
            ? `"${text.replace(/"/g, '""')}"`
            : text;
        })
        .join(",");
    });
    return `\uFEFF${[fields.join(","), ...rows].join("\n")}`;
  }

  async listBackups(query: AdminBackupListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const [items, total] = await Promise.all([
      this.prisma.backup.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          scope: true,
          trigger: true,
          status: true,
          databaseKey: true,
          filesPrefix: true,
          checksum: true,
          sizeBytes: true,
          fileCount: true,
          appVersion: true,
          migrationVersion: true,
          createdById: true,
          errorCode: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          expiresAt: true,
          operations: {
            where: { type: BackupOperationType.RESTORE },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              errorCode: true,
              details: true,
              createdAt: true,
              completedAt: true,
            },
          },
        },
      }),
      this.prisma.backup.count(),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        sizeBytes: item.sizeBytes === null ? null : Number(item.sizeBytes),
        restoreOperation: item.operations[0] ?? null,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getBackup(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
      include: {
        operations: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            status: true,
            errorCode: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!backup) {
      throw new NotFoundException({
        code: "BACKUP_NOT_FOUND",
        details: { id },
      });
    }

    return {
      ...backup,
      sizeBytes: backup.sizeBytes === null ? null : Number(backup.sizeBytes),
    };
  }

  async getDownloadUrl(id: string, requestedById: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
      select: { id: true, status: true, databaseKey: true, expiresAt: true },
    });

    if (!backup) {
      throw new NotFoundException({
        code: "BACKUP_NOT_FOUND",
        details: { id },
      });
    }
    if (backup.status !== BackupStatus.COMPLETED || !backup.databaseKey) {
      throw new ConflictException({
        code: "BACKUP_NOT_READY",
        details: { status: backup.status },
      });
    }
    if (backup.expiresAt && backup.expiresAt <= new Date()) {
      throw new ConflictException({ code: "BACKUP_EXPIRED", details: {} });
    }

    if (!(await this.storage.exists(backup.databaseKey))) {
      throw new ConflictException({
        code: "BACKUP_OBJECT_MISSING",
        details: { id },
      });
    }

    const url = await this.storage.getPresignedUrl(backup.databaseKey, 300);
    await this.actionLog.record({
      actorId: requestedById,
      targetType: "backup",
      targetId: id,
      actionType: "backup.download_requested",
      afterState: { expiresInSeconds: 300 },
    });

    return { url, expiresInSeconds: 300 };
  }

  async recoverStaleOperations(): Promise<void> {
    const now = new Date();
    const staleOperations = await this.prisma.backupOperation.findMany({
      where: {
        type: { in: [BackupOperationType.CREATE, BackupOperationType.RESTORE] },
        status: BackupOperationStatus.RUNNING,
        leaseExpiresAt: { lt: now },
      },
      select: {
        id: true,
        backupId: true,
        type: true,
        attemptCount: true,
        maxAttempts: true,
      },
    });

    for (const operation of staleOperations) {
      let recovered = false;
      await this.prisma.$transaction(async (tx) => {
        const retryable = operation.attemptCount < operation.maxAttempts;
        const nextAttemptAt = new Date(
          Date.now() + Math.min(15 * 60_000, 30_000 * 2 ** operation.attemptCount),
        );
        const claimed = await tx.backupOperation.updateMany({
          where: {
            id: operation.id,
            status: BackupOperationStatus.RUNNING,
            leaseExpiresAt: { lt: now },
          },
          data: retryable
            ? {
                status: BackupOperationStatus.QUEUED,
                errorCode: "BACKUP_OPERATION_STALE",
                leaseOwner: null,
                leaseExpiresAt: null,
                nextAttemptAt,
              }
            : {
                status: BackupOperationStatus.FAILED,
                errorCode: "BACKUP_OPERATION_STALE",
                leaseOwner: null,
                leaseExpiresAt: null,
                completedAt: new Date(),
              },
        });
        if (claimed.count !== 1) return;
        recovered = true;
        if (!operation.backupId || operation.type !== BackupOperationType.CREATE) return;
        await tx.backup.updateMany({
          where: {
            id: operation.backupId,
            status: { in: [BackupStatus.QUEUED, BackupStatus.RUNNING] },
          },
          data: retryable
            ? { status: BackupStatus.QUEUED, errorCode: "BACKUP_OPERATION_STALE" }
            : {
                status: BackupStatus.FAILED,
                errorCode: "BACKUP_OPERATION_STALE",
                completedAt: new Date(),
              },
        });
      });
      if (
        recovered &&
        operation.backupId &&
        operation.type === BackupOperationType.CREATE
      ) {
        try {
          await this.storage.deleteByPrefixStrict(
            `${BACKUP_PREFIX}${operation.backupId}/attempt-${operation.attemptCount}/`,
          );
        } catch (error) {
          this.logger.error(
            `Stale backup artifact cleanup failed for ${operation.id}: ${error instanceof Error ? error.message : "BACKUP_STALE_ARTIFACT_CLEANUP_FAILED"}`,
          );
        }
      }
    }
  }

  async cleanupRestoreTargets(): Promise<void> {
    if (
      process.env.BACKUP_RESTORE_ENABLED !== "true" ||
      !process.env.RESTORE_DATABASE_URL ||
      process.env.BACKUP_RESTORE_KEEP_TARGET === "true"
    ) {
      return;
    }
    const operations = await this.prisma.backupOperation.findMany({
      where: {
        type: BackupOperationType.RESTORE,
        status: {
          in: [
            BackupOperationStatus.QUEUED,
            BackupOperationStatus.FAILED,
            BackupOperationStatus.COMPLETED,
          ],
        },
        attemptCount: { gt: 0 },
      },
      take: 100,
      select: { id: true, attemptCount: true },
    });
    for (const operation of operations) {
      for (let attempt = 1; attempt <= operation.attemptCount; attempt += 1) {
        try {
          await this.dropRestoreDatabase(
            this.restoreTargetUrl(
              process.env.RESTORE_DATABASE_URL,
              operation.id,
              attempt,
            ),
          );
        } catch {
          this.logger.error("BACKUP_RESTORE_TARGET_CLEANUP_FAILED");
        }
      }
    }
  }

  async cleanupFailedBackupArtifacts(): Promise<void> {
    const failed = await this.prisma.backup.findMany({
      where: {
        status: BackupStatus.FAILED,
        completedAt: { lt: new Date(Date.now() - 60 * 60_000) },
      },
      take: 20,
      select: { id: true },
    });

    for (const backup of failed) {
      try {
        await this.storage.deleteByPrefixStrict(`${BACKUP_PREFIX}${backup.id}/`);
      } catch (error) {
        this.logger.error(
          `Failed backup artifact cleanup failed for ${backup.id}: ${error instanceof Error ? error.message : "BACKUP_FAILED_ARTIFACT_CLEANUP_FAILED"}`,
        );
      }
    }
  }

  async expireBackups(): Promise<void> {
    const expired = await this.prisma.backup.findMany({
      where: {
        status: BackupStatus.COMPLETED,
        expiresAt: { lt: new Date() },
      },
      take: 20,
      select: { id: true },
    });

    for (const backup of expired) {
      try {
        await this.storage.deleteByPrefixStrict(
          `${BACKUP_PREFIX}${backup.id}/`,
        );
        await this.prisma.backup.update({
          where: { id: backup.id },
          data: { status: BackupStatus.EXPIRED },
        });
      } catch (error) {
        this.logger.error(
          `Backup retention failed for ${backup.id}: ${error instanceof Error ? error.message : "BACKUP_RETENTION_FAILED"}`,
        );
      }
    }
  }

  async processNextOperation(workerId: string): Promise<boolean> {
    const operation = await this.prisma.backupOperation.findFirst({
      where: {
        type: { in: [BackupOperationType.CREATE, BackupOperationType.RESTORE] },
        status: BackupOperationStatus.QUEUED,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, type: true, attemptCount: true },
    });

    if (!operation) return false;

    const leaseExpiresAt = new Date(Date.now() + BACKUP_LEASE_MS);
    const claimed = await this.prisma.backupOperation.updateMany({
      where: { id: operation.id, status: BackupOperationStatus.QUEUED },
      data: {
        status: BackupOperationStatus.RUNNING,
        startedAt: new Date(),
        leaseOwner: workerId,
        leaseExpiresAt,
        attemptCount: { increment: 1 },
        nextAttemptAt: null,
      },
    });

    if (claimed.count !== 1) return false;

    const attemptCount = operation.attemptCount + 1;
    if (operation.type === BackupOperationType.RESTORE) {
      await this.processRestore(operation.id, workerId, attemptCount);
    } else {
      await this.processCreate(operation.id, workerId, attemptCount);
    }
    return true;
  }

  private async processRestore(
    operationId: string,
    workerId: string,
    attemptCount: number,
  ): Promise<void> {
    const operation = await this.prisma.backupOperation.findFirst({
      where: {
        id: operationId,
        type: BackupOperationType.RESTORE,
        status: BackupOperationStatus.RUNNING,
        leaseOwner: workerId,
        attemptCount,
      },
      include: { backup: true },
    });
    if (!operation) return;
    if (!operation.backup?.databaseKey) {
      await this.prisma.backupOperation.updateMany({
        where: {
          id: operationId,
          status: BackupOperationStatus.RUNNING,
          leaseOwner: workerId,
          attemptCount,
        },
        data: {
          status: BackupOperationStatus.FAILED,
          errorCode: "BACKUP_RESTORE_SOURCE_MISSING",
          details: { code: "BACKUP_RESTORE_SOURCE_MISSING", retryable: false },
          leaseOwner: null,
          leaseExpiresAt: null,
          completedAt: new Date(),
        },
      });
      return;
    }
    if (process.env.BACKUP_RESTORE_ENABLED !== "true") {
      await this.markOperationFailed(
        operationId,
        operation.backup.id,
        workerId,
        "BACKUP_RESTORE_DISABLED",
        BackupOperationType.RESTORE,
        false,
      );
      return;
    }

    const restoreDatabaseUrl = process.env.RESTORE_DATABASE_URL;
    const databaseUrl = process.env.DATABASE_URL;
    if (!restoreDatabaseUrl || !databaseUrl) {
      await this.markOperationFailed(
        operationId,
        operation.backup.id,
        workerId,
        "BACKUP_RESTORE_TARGET_MISSING",
        BackupOperationType.RESTORE,
        false,
      );
      return;
    }
    let sameServer: boolean;
    try {
      sameServer = await this.isSameDatabaseServer(
        restoreDatabaseUrl,
        databaseUrl,
      );
    } catch {
      await this.markOperationFailed(
        operationId,
        operation.backup.id,
        workerId,
        "BACKUP_RESTORE_TARGET_IDENTITY_UNVERIFIED",
        BackupOperationType.RESTORE,
        false,
      );
      return;
    }
    const restoreDatabase = decodeURIComponent(
      new URL(restoreDatabaseUrl).pathname.replace(/^\//, ""),
    );
    const liveDatabase = decodeURIComponent(
      new URL(databaseUrl).pathname.replace(/^\//, ""),
    );
    if (
      (sameServer && restoreDatabase === liveDatabase) ||
      (sameServer && process.env.BACKUP_RESTORE_ALLOW_SAME_SERVER !== "true")
    ) {
      await this.markOperationFailed(
        operationId,
        operation.backup.id,
        workerId,
        "BACKUP_RESTORE_TARGET_IS_LIVE_DATABASE",
        BackupOperationType.RESTORE,
        false,
      );
      return;
    }

    let workingDirectory: string | undefined;
    let isolatedDatabaseUrl: string | undefined;
    let leaseTimer: NodeJS.Timeout | undefined;
    let leaseLost = false;
    const assertLease = () => {
      if (leaseLost) throw new Error("BACKUP_OPERATION_FENCED");
    };
    try {
      await this.storage.reload();
      workingDirectory = await mkdtemp(join(tmpdir(), "hassad-restore-"));
      leaseTimer = this.startLeaseRenewal(operationId, workerId, () => {
        leaseLost = true;
      });
      const databaseFile = join(workingDirectory, "database.dump");
      await this.storage.downloadToFile(operation.backup.databaseKey, databaseFile);
      const checksum = await this.sha256(databaseFile);
      if (operation.backup.checksum && checksum !== operation.backup.checksum) {
        throw new Error("BACKUP_RESTORE_CHECKSUM_FAILED");
      }
      assertLease();
      isolatedDatabaseUrl = await this.createRestoreDatabase(
        restoreDatabaseUrl,
        operationId,
        attemptCount,
      );
      assertLease();
      await this.restoreDatabaseDump(databaseFile, isolatedDatabaseUrl);
      assertLease();
      const validation = await this.validateRestoreDatabase(isolatedDatabaseUrl);
      const finalized = await this.prisma.backupOperation.updateMany({
        where: {
          id: operationId,
          type: BackupOperationType.RESTORE,
          status: BackupOperationStatus.RUNNING,
          leaseOwner: workerId,
          attemptCount,
        },
        data: {
          status: BackupOperationStatus.COMPLETED,
          errorCode: null,
          details: {
            code: "BACKUP_RESTORE_VERIFIED",
            checksum,
            validation,
            target: this.databaseIdentity(isolatedDatabaseUrl),
          },
          leaseOwner: null,
          leaseExpiresAt: null,
          nextAttemptAt: null,
          completedAt: new Date(),
        },
      });
      if (finalized.count !== 1) throw new Error("BACKUP_OPERATION_FENCED");
      this.logger.log(`Restore verification completed for ${operationId}`);
    } catch (error) {
      const code = this.toRestoreErrorCode(error);
      await this.markOperationFailed(
        operationId,
        operation.backup.id,
        workerId,
        code,
        BackupOperationType.RESTORE,
        code === "BACKUP_RESTORE_SOURCE_MISSING" ? false : undefined,
      );
      this.logger.error(`Restore verification ${operationId} failed with ${code}`);
    } finally {
      if (leaseTimer) clearInterval(leaseTimer);
      if (
        isolatedDatabaseUrl &&
        process.env.BACKUP_RESTORE_KEEP_TARGET !== "true"
      ) {
        try {
          await this.dropRestoreDatabase(isolatedDatabaseUrl);
        } catch {
          this.logger.error("BACKUP_RESTORE_TARGET_CLEANUP_FAILED");
        }
      }
      if (workingDirectory) await rm(workingDirectory, { recursive: true, force: true });
    }
  }

  private async processCreate(
    operationId: string,
    workerId: string,
    attemptCount: number,
  ): Promise<void> {
    const operation = await this.prisma.backupOperation.findFirst({
      where: {
        id: operationId,
        status: BackupOperationStatus.RUNNING,
        leaseOwner: workerId,
        attemptCount,
      },
      include: { backup: true },
    });

    if (!operation?.backup) return;

    const backup = operation.backup;
    const attemptPrefix = `${BACKUP_PREFIX}${backup.id}/attempt-${operation.attemptCount}/`;
    let workingDirectory: string | undefined;
    let leaseTimer: NodeJS.Timeout | undefined;
    let leaseLost = false;
    const assertLease = () => {
      if (leaseLost) throw new Error("BACKUP_OPERATION_FENCED");
    };

    try {
      await this.storage.reload();
      workingDirectory = await mkdtemp(join(tmpdir(), "hassad-backup-"));
      const databaseFile = join(workingDirectory, "database.dump");
      const started = await this.prisma.backup.updateMany({
        where: { id: backup.id, status: BackupStatus.QUEUED },
        data: { status: BackupStatus.RUNNING, startedAt: new Date() },
      });
      if (started.count !== 1) {
        throw new Error("BACKUP_OPERATION_FENCED");
      }

      leaseTimer = setInterval(() => {
        void this.prisma.backupOperation
          .updateMany({
            where: {
              id: operationId,
              status: BackupOperationStatus.RUNNING,
              leaseOwner: workerId,
            },
            data: { leaseExpiresAt: new Date(Date.now() + BACKUP_LEASE_MS) },
          })
          .then((result) => {
            if (result.count !== 1) {
              leaseLost = true;
              this.logger.error(`Backup lease lost for ${operationId}`);
            }
          })
          .catch((error) => {
            leaseLost = true;
            this.logger.error(
              `Backup lease renewal failed for ${operationId}: ${error instanceof Error ? error.message : "BACKUP_LEASE_RENEWAL_FAILED"}`,
            );
          });
      }, 30_000);

      assertLease();
      await this.createDatabaseDump(databaseFile);
      const fileStats = await stat(databaseFile);
      const checksum = await this.sha256(databaseFile);
      const databaseKey = `${attemptPrefix}database.dump`;

      await this.storage.uploadStream(
        databaseKey,
        createReadStream(databaseFile),
        "application/octet-stream",
        fileStats.size,
      );
      const remoteDatabaseChecksum =
        await this.storage.sha256Object(databaseKey);
      if (remoteDatabaseChecksum !== checksum) {
        throw new Error("BACKUP_DATABASE_UPLOAD_VERIFICATION_FAILED");
      }
      assertLease();

      let filesPrefix: string | undefined;
      let fileCount = 0;
      let manifestKey: string | undefined;

      if (backup.scope === BackupScope.FULL_SYSTEM) {
        filesPrefix = `${attemptPrefix}files/`;
        const sourceKeys = (await this.storage.listKeys()).filter(
          (key) => !key.startsWith(BACKUP_PREFIX),
        );
        const files: Array<{
          sourceKey: string;
          backupKey: string;
          size: number;
          contentType: string | null;
          etag: string | null;
          checksumSha256: string | null;
        }> = [];

        for (
          let index = 0;
          index < sourceKeys.length;
          index += BACKUP_FILE_COPY_CONCURRENCY
        ) {
          const batch = sourceKeys.slice(
            index,
            index + BACKUP_FILE_COPY_CONCURRENCY,
          );
          const batchFiles = await Promise.all(
            batch.map(async (sourceKey) => {
              const sourceMetadata =
                await this.storage.getObjectMetadata(sourceKey);
              const destinationKey = `${filesPrefix}${sourceKey}`;
              await this.storage.copyObject(sourceKey, destinationKey);
              const destinationMetadata =
                await this.storage.getObjectMetadata(destinationKey);
              if (destinationMetadata.size !== sourceMetadata.size) {
                throw new Error("BACKUP_FILE_COPY_VERIFICATION_FAILED");
              }
              const metadataMatches =
                sourceMetadata.checksumSha256 &&
                destinationMetadata.checksumSha256
                  ? sourceMetadata.checksumSha256 ===
                    destinationMetadata.checksumSha256
                  : sourceMetadata.etag && destinationMetadata.etag
                    ? sourceMetadata.etag === destinationMetadata.etag
                    : false;
              const contentMatches = metadataMatches
                ? true
                : (await this.storage.sha256Object(sourceKey)) ===
                  (await this.storage.sha256Object(destinationKey));
              if (!contentMatches) {
                throw new Error("BACKUP_FILE_COPY_VERIFICATION_FAILED");
              }
              return {
                sourceKey,
                backupKey: destinationKey,
                size: destinationMetadata.size,
                contentType: destinationMetadata.contentType,
                etag: destinationMetadata.etag,
                checksumSha256: destinationMetadata.checksumSha256,
              };
            }),
          );
          files.push(...batchFiles);
        }

        assertLease();
        fileCount = files.length;
        manifestKey = `${attemptPrefix}manifest.json`;
        await this.storage.uploadBuffer(
          manifestKey,
          Buffer.from(
            JSON.stringify({
              formatVersion: 2,
              backupId: backup.id,
              createdAt: new Date().toISOString(),
              database: {
                key: databaseKey,
                size: fileStats.size,
                checksumSha256: checksum,
              },
              files,
            }),
          ),
          "application/json",
        );
      }

      assertLease();
      const finalized = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.backupOperation.updateMany({
          where: {
            id: operationId,
            status: BackupOperationStatus.RUNNING,
            leaseOwner: workerId,
          },
          data: {
            status: BackupOperationStatus.COMPLETED,
            errorCode: null,
            details: Prisma.JsonNull,
            leaseOwner: null,
            leaseExpiresAt: null,
            nextAttemptAt: null,
            completedAt: new Date(),
          },
        });
        if (claimed.count !== 1) return false;
        await tx.backup.update({
          where: { id: backup.id },
          data: {
            status: BackupStatus.COMPLETED,
            errorCode: null,
            errorDetails: Prisma.JsonNull,
            databaseKey,
            filesPrefix,
            manifestKey,
            checksum,
            sizeBytes: BigInt(fileStats.size),
            fileCount,
            appVersion: process.env.APP_VERSION ?? null,
            migrationVersion: await this.getMigrationVersion(),
            completedAt: new Date(),
          },
        });
        return true;
      });
      if (!finalized) {
        throw new Error("BACKUP_OPERATION_FENCED");
      }
    } catch (error) {
      try {
        await this.storage.deleteByPrefixStrict(attemptPrefix);
      } catch (cleanupError) {
        this.logger.error(
          `Backup cleanup failed for ${backup.id}: ${cleanupError instanceof Error ? cleanupError.message : "BACKUP_CLEANUP_FAILED"}`,
        );
      }
      const code = this.toBackupErrorCode(error);
      this.logger.error(`Backup operation ${operationId} failed with ${code}`);
      try {
        await this.markOperationFailed(operationId, backup.id, workerId, code);
      } catch (markError) {
        this.logger.error(
          `Backup failure state update failed for ${operationId}: ${markError instanceof Error ? markError.message : "BACKUP_STATE_UPDATE_FAILED"}`,
        );
      }
    } finally {
      if (leaseTimer) clearInterval(leaseTimer);
      if (workingDirectory) {
        await rm(workingDirectory, { recursive: true, force: true });
      }
    }
  }

  private async markOperationFailed(
    operationId: string,
    backupId: string,
    workerId: string,
    code: string,
    operationType: BackupOperationType = BackupOperationType.CREATE,
    retryableOverride?: boolean,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const operation = await tx.backupOperation.findUnique({
        where: { id: operationId },
        select: { attemptCount: true, maxAttempts: true },
      });
      if (!operation) return;

      const retryable =
        retryableOverride ?? operation.attemptCount < operation.maxAttempts;
      const nextAttemptAt = new Date(
        Date.now() + Math.min(15 * 60_000, 30_000 * 2 ** operation.attemptCount),
      );
      const claimed = await tx.backupOperation.updateMany({
        where: {
          id: operationId,
          status: BackupOperationStatus.RUNNING,
          leaseOwner: workerId,
        },
        data: retryable
          ? {
              status: BackupOperationStatus.QUEUED,
              errorCode: code,
              details: { code, retryable: true },
              leaseOwner: null,
              leaseExpiresAt: null,
              nextAttemptAt,
            }
          : {
              status: BackupOperationStatus.FAILED,
              errorCode: code,
              details: { code, retryable: false },
              leaseOwner: null,
              leaseExpiresAt: null,
              completedAt: new Date(),
            },
      });
      if (claimed.count !== 1) return;
      if (operationType === BackupOperationType.CREATE) {
        await tx.backup.updateMany({
          where: {
            id: backupId,
            status: { in: [BackupStatus.QUEUED, BackupStatus.RUNNING] },
          },
          data: retryable
            ? { status: BackupStatus.QUEUED, errorCode: code }
            : {
                status: BackupStatus.FAILED,
                errorCode: code,
                completedAt: new Date(),
              },
        });
      }
    });
  }

  private async isSameDatabaseServer(
    restoreDatabaseUrl: string,
    databaseUrl: string,
  ): Promise<boolean> {
    const restore = new URL(restoreDatabaseUrl);
    const live = new URL(databaseUrl);
    if ((restore.port || "5432") !== (live.port || "5432")) return false;
    if (restore.hostname === live.hostname) return true;
    const [restoreAddresses, liveAddresses] = await Promise.all([
      lookup(restore.hostname, { all: true }),
      lookup(live.hostname, { all: true }),
    ]);
    return restoreAddresses.some((restoreAddress) =>
      liveAddresses.some(
        (liveAddress) => restoreAddress.address === liveAddress.address,
      ),
    );
  }

  private databaseIdentity(databaseUrl: string): string {
    const database = new URL(databaseUrl);
    const databaseName = decodeURIComponent(database.pathname.replace(/^\//, ""));
    return `${database.protocol}//${database.hostname}:${database.port || "5432"}/${databaseName}`;
  }

  private restoreTargetUrl(
    databaseUrl: string | undefined,
    operationId: string,
    attemptCount: number,
  ): string {
    if (!databaseUrl) throw new Error("BACKUP_RESTORE_TARGET_MISSING");
    const base = this.postgresTarget(databaseUrl);
    const isolatedName = `${base.databaseName}_${operationId.replace(/-/g, "").slice(0, 12)}_${attemptCount}`;
    const target = new URL(databaseUrl);
    target.pathname = `/${isolatedName}`;
    return target.toString();
  }

  private postgresTarget(databaseUrl: string) {
    const database = new URL(databaseUrl);
    const databaseName = decodeURIComponent(database.pathname.replace(/^\//, ""));
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseName)) {
      throw new Error("BACKUP_RESTORE_DATABASE_NAME_INVALID");
    }
    return {
      databaseName,
      env: {
        ...process.env,
        PGHOST: database.hostname,
        PGPORT: database.port || "5432",
        PGUSER: decodeURIComponent(database.username),
        PGPASSWORD: decodeURIComponent(database.password),
        PGDATABASE: databaseName,
        ...(database.searchParams.has("sslmode")
          ? { PGSSLMODE: database.searchParams.get("sslmode") ?? undefined }
          : {}),
      },
    };
  }

  private async runPostgresTool(
    command: string,
    args: string[],
    env: NodeJS.ProcessEnv,
  ): Promise<string> {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "ignore"],
      env,
    });
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    const [exitCode] = (await once(child, "close")) as [number | null];
    if (exitCode !== 0) {
      throw new Error(
        exitCode === null
          ? BACKUP_TOOL_UNAVAILABLE
          : `POSTGRES_TOOL_EXIT_${exitCode}`,
      );
    }
    return output.trim();
  }

  private async createRestoreDatabase(
    databaseUrl: string,
    operationId: string,
    attemptCount: number,
  ): Promise<string> {
    const base = this.postgresTarget(databaseUrl);
    if (!/^hassad_restore(?:_|$)/.test(base.databaseName)) {
      throw new Error("BACKUP_RESTORE_TARGET_NAME_INVALID");
    }
    const isolatedName = this.postgresTarget(
      this.restoreTargetUrl(databaseUrl, operationId, attemptCount),
    ).databaseName;
    if (isolatedName.length > 63) {
      throw new Error("BACKUP_RESTORE_TARGET_NAME_TOO_LONG");
    }
    const isolatedUrl = new URL(databaseUrl);
    isolatedUrl.pathname = `/${isolatedName}`;
    const maintenance = this.postgresTarget(databaseUrl);
    maintenance.env.PGDATABASE = "postgres";
    const quotedName = `"${isolatedName.replace(/"/g, '""')}"`;
    const existing = await this.runPostgresTool(
      "psql",
      [
        "--dbname=postgres",
        "--tuples-only",
        "--no-align",
        "--command",
        `SELECT COALESCE(shobj_description(oid, 'pg_database'), '') FROM pg_database WHERE datname = '${isolatedName.replace(/'/g, "''")}'`,
      ],
      maintenance.env,
    );
    if (existing && existing !== "hassad-backup-restore-target-v1") {
      throw new Error("BACKUP_RESTORE_TARGET_MARKER_INVALID");
    }
    if (!existing) {
      await this.runPostgresTool(
        "psql",
        [
          "--dbname=postgres",
          "--set=ON_ERROR_STOP=1",
          "--command",
          `CREATE DATABASE ${quotedName}`,
        ],
        maintenance.env,
      );
      await this.runPostgresTool(
        "psql",
        [
          "--dbname=postgres",
          "--set=ON_ERROR_STOP=1",
          "--command",
          `COMMENT ON DATABASE ${quotedName} IS 'hassad-backup-restore-target-v1'`,
        ],
        maintenance.env,
      );
    }
    return isolatedUrl.toString();
  }

  private async dropRestoreDatabase(databaseUrl: string): Promise<void> {
    const target = this.postgresTarget(databaseUrl);
    const maintenance = this.postgresTarget(databaseUrl);
    maintenance.env.PGDATABASE = "postgres";
    const marker = await this.runPostgresTool(
      "psql",
      [
        "--dbname=postgres",
        "--tuples-only",
        "--no-align",
        "--command",
        `SELECT COALESCE(shobj_description(oid, 'pg_database'), '') FROM pg_database WHERE datname = '${target.databaseName.replace(/'/g, "''")}'`,
      ],
      maintenance.env,
    );
    if (!marker) return;
    if (marker !== "hassad-backup-restore-target-v1") {
      throw new Error("BACKUP_RESTORE_TARGET_MARKER_INVALID");
    }
    await this.runPostgresTool(
      "psql",
      [
        "--dbname=postgres",
        "--set=ON_ERROR_STOP=1",
        "--command",
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${target.databaseName.replace(/'/g, "''")}'`,
      ],
      maintenance.env,
    );
    await this.runPostgresTool(
      "psql",
      [
        "--dbname=postgres",
        "--set=ON_ERROR_STOP=1",
        "--command",
        `DROP DATABASE IF EXISTS \"${target.databaseName.replace(/\"/g, '""')}\"`,
      ],
      maintenance.env,
    );
  }

  private async restoreDatabaseDump(
    filepath: string,
    databaseUrl: string,
  ): Promise<void> {
    const target = this.postgresTarget(databaseUrl);
    await this.runPostgresTool(
      "pg_restore",
      [
        "--exit-on-error",
        "--no-owner",
        "--no-acl",
        `--dbname=${target.databaseName}`,
        filepath,
      ],
      target.env,
    );
  }

  private async validateRestoreDatabase(databaseUrl: string) {
    const target = this.postgresTarget(databaseUrl);
    const result = await this.runPostgresTool(
      "psql",
      [
        `--dbname=${target.databaseName}`,
        "--tuples-only",
        "--no-align",
        "--command",
        "SELECT json_build_object('database', current_database(), 'publicTables', (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public'), 'users', (SELECT count(*) FROM users), 'prismaMigrations', EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations'), 'appliedMigrations', (SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL))::text",
      ],
      target.env,
    );
    const validation = JSON.parse(result) as {
      database: string;
      publicTables: number;
      users: number;
      prismaMigrations: boolean;
      appliedMigrations: number;
    };
    if (
      !validation.prismaMigrations ||
      validation.publicTables === 0 ||
      validation.appliedMigrations === 0
    ) {
      throw new Error("BACKUP_RESTORE_VALIDATION_FAILED");
    }
    return validation;
  }

  private startLeaseRenewal(
    operationId: string,
    workerId: string,
    onLost: () => void,
  ): NodeJS.Timeout {
    return setInterval(() => {
      void this.prisma.backupOperation
        .updateMany({
          where: {
            id: operationId,
            status: BackupOperationStatus.RUNNING,
            leaseOwner: workerId,
          },
          data: { leaseExpiresAt: new Date(Date.now() + BACKUP_LEASE_MS) },
        })
        .then((result) => {
          if (result.count !== 1) onLost();
        })
        .catch(() => onLost());
    }, 30_000);
  }

  private async createDatabaseDump(filepath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_CONFIGURATION_MISSING");

    const database = new URL(databaseUrl);
    const databaseName = database.pathname.replace(/^\//, "");
    const child = spawn(
      "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-acl",
        `--file=${filepath}`,
        `--dbname=${databaseName}`,
      ],
      {
        stdio: ["ignore", "ignore", "ignore"],
        env: {
          ...process.env,
          PGHOST: database.hostname,
          PGPORT: database.port || "5432",
          PGUSER: decodeURIComponent(database.username),
          PGPASSWORD: decodeURIComponent(database.password),
          PGDATABASE: databaseName,
          ...(database.searchParams.has("sslmode")
            ? { PGSSLMODE: database.searchParams.get("sslmode") ?? undefined }
            : {}),
        },
      },
    );
    const [exitCode] = (await once(child, "close")) as [number | null];
    if (exitCode !== 0) {
      throw new Error(
        exitCode === null
          ? BACKUP_TOOL_UNAVAILABLE
          : `PG_DUMP_EXIT_${exitCode}`,
      );
    }
  }

  private async sha256(filepath: string): Promise<string> {
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(filepath)) hash.update(chunk);
    return hash.digest("hex");
  }

  private async getMigrationVersion(): Promise<string | null> {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{ migration_name: string }>
      >(
        Prisma.sql`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1`,
      );
      return rows[0]?.migration_name ?? null;
    } catch {
      return null;
    }
  }

  private retentionDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + BACKUP_RETENTION_DAYS);
    return date;
  }

  private toRestoreErrorCode(error: unknown): string {
    if (error instanceof Error && error.message.startsWith("BACKUP_RESTORE_")) {
      return error.message;
    }
    const candidate = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
    } | null;
    if (
      candidate?.name === "NoSuchKey" ||
      candidate?.name === "NotFound" ||
      candidate?.$metadata?.httpStatusCode === 404
    ) {
      return "BACKUP_RESTORE_SOURCE_MISSING";
    }
    return "BACKUP_RESTORE_FAILED";
  }

  private toBackupErrorCode(error: unknown): string {
    if (error instanceof Error && error.message.startsWith("BACKUP_")) {
      return error.message;
    }
    if (error instanceof Error && error.message === BACKUP_TOOL_UNAVAILABLE) {
      return BACKUP_TOOL_UNAVAILABLE;
    }
    if (
      error instanceof Error &&
      error.message === "DATABASE_CONFIGURATION_MISSING"
    ) {
      return "DATABASE_CONFIGURATION_MISSING";
    }
    if (error instanceof Error && error.message.includes("R2_CONFIGURATION")) {
      return error.message;
    }
    return "BACKUP_OPERATION_FAILED";
  }
}
