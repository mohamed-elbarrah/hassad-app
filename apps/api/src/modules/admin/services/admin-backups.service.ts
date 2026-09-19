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
          type: BackupOperationType.CREATE,
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
        },
      }),
      this.prisma.backup.count(),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        sizeBytes: item.sizeBytes === null ? null : Number(item.sizeBytes),
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
        type: BackupOperationType.CREATE,
        status: BackupOperationStatus.RUNNING,
        leaseExpiresAt: { lt: now },
      },
      select: { id: true, backupId: true },
    });

    for (const operation of staleOperations) {
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.backupOperation.updateMany({
          where: {
            id: operation.id,
            status: BackupOperationStatus.RUNNING,
            leaseExpiresAt: { lt: now },
          },
          data: {
            status: BackupOperationStatus.FAILED,
            errorCode: "BACKUP_OPERATION_STALE",
            completedAt: new Date(),
          },
        });
        if (claimed.count !== 1 || !operation.backupId) return;
        await tx.backup.updateMany({
          where: {
            id: operation.backupId,
            status: { in: [BackupStatus.QUEUED, BackupStatus.RUNNING] },
          },
          data: {
            status: BackupStatus.FAILED,
            errorCode: "BACKUP_OPERATION_STALE",
            completedAt: new Date(),
          },
        });
      });
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
        type: BackupOperationType.CREATE,
        status: BackupOperationStatus.QUEUED,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
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
      },
    });

    if (claimed.count !== 1) return false;

    await this.processCreate(operation.id, workerId);
    return true;
  }

  private async processCreate(
    operationId: string,
    workerId: string,
  ): Promise<void> {
    const operation = await this.prisma.backupOperation.findUnique({
      where: { id: operationId },
      include: { backup: true },
    });

    if (!operation?.backup) return;

    const backup = operation.backup;
    let workingDirectory: string | undefined;
    let leaseTimer: NodeJS.Timeout | undefined;

    try {
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
        void this.prisma.backupOperation.updateMany({
          where: {
            id: operationId,
            status: BackupOperationStatus.RUNNING,
            leaseOwner: workerId,
          },
          data: { leaseExpiresAt: new Date(Date.now() + BACKUP_LEASE_MS) },
        });
      }, 30_000);
      leaseTimer.unref();

      await this.createDatabaseDump(databaseFile);
      const fileStats = await stat(databaseFile);
      const checksum = await this.sha256(databaseFile);
      const databaseKey = `${BACKUP_PREFIX}${backup.id}/database.dump`;

      await this.storage.uploadStream(
        databaseKey,
        createReadStream(databaseFile),
        "application/octet-stream",
        fileStats.size,
      );

      let filesPrefix: string | undefined;
      let fileCount = 0;
      let manifestKey: string | undefined;

      if (backup.scope === BackupScope.FULL_SYSTEM) {
        filesPrefix = `${BACKUP_PREFIX}${backup.id}/files/`;
        const sourceKeys = (await this.storage.listKeys()).filter(
          (key) => !key.startsWith(BACKUP_PREFIX),
        );
        for (const sourceKey of sourceKeys) {
          const destinationKey = `${filesPrefix}${sourceKey}`;
          await this.storage.copyObject(sourceKey, destinationKey);
          if (!(await this.storage.exists(destinationKey))) {
            throw new Error("BACKUP_FILE_COPY_VERIFICATION_FAILED");
          }
        }
        fileCount = sourceKeys.length;
        manifestKey = `${BACKUP_PREFIX}${backup.id}/manifest.json`;
        await this.storage.uploadBuffer(
          manifestKey,
          Buffer.from(
            JSON.stringify({ backupId: backup.id, keys: sourceKeys }),
          ),
          "application/json",
        );
      }

      const finalized = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.backupOperation.updateMany({
          where: {
            id: operationId,
            status: BackupOperationStatus.RUNNING,
            leaseOwner: workerId,
          },
          data: {
            status: BackupOperationStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        if (claimed.count !== 1) return false;
        await tx.backup.update({
          where: { id: backup.id },
          data: {
            status: BackupStatus.COMPLETED,
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
        await this.storage.deleteByPrefixStrict(
          `${BACKUP_PREFIX}${backup.id}/`,
        );
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
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.backupOperation.updateMany({
        where: {
          id: operationId,
          status: BackupOperationStatus.RUNNING,
          leaseOwner: workerId,
        },
        data: {
          status: BackupOperationStatus.FAILED,
          errorCode: code,
          details: { code },
          completedAt: new Date(),
        },
      });
      if (claimed.count !== 1) return;
      await tx.backup.updateMany({
        where: {
          id: backupId,
          status: { in: [BackupStatus.QUEUED, BackupStatus.RUNNING] },
        },
        data: {
          status: BackupStatus.FAILED,
          errorCode: code,
          completedAt: new Date(),
        },
      });
    });
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
