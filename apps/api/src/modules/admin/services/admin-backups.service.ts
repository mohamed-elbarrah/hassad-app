import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminBackupsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportData(type: string) {
    switch (type) {
      case "users": {
        const users = await this.prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        });
        return this.toCsv(users, [
          "id",
          "name",
          "email",
          "isActive",
          "createdAt",
        ]);
      }
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
          clients.map((c) => ({
            id: c.id,
            name: c.user?.name ?? "",
            email: c.user?.email ?? "",
            companyName: c.companyName ?? c.businessName ?? "",
            isActive: c.user?.isActive ?? false,
            createdAt: c.user?.createdAt ?? "",
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
          invoices.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            client: i.client?.companyName ?? "",
            amount: i.amount,
            status: i.status,
            dueDate: i.dueDate,
            createdAt: i.createdAt,
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
          orderBy: { createdAt: "desc" },
        });
        return this.toCsv(
          requests.map((l) => ({
            id: l.id,
            companyName: l.companyName,
            contactName: l.contactName,
            email: l.email ?? "",
            phone: l.phoneWhatsapp ?? "",
            pipelineStage: l.status,
            source: l.source,
            assignee: l.assignee?.name ?? "",
            createdAt: l.createdAt.toISOString(),
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
          orderBy: { createdAt: "desc" },
        });
        return this.toCsv(
          contracts.map((c) => ({
            id: c.id,
            title: c.title,
            client: c.client?.companyName ?? "",
            type: c.type,
            status: c.status,
            totalValue: c.totalValue,
            monthlyValue: c.monthlyValue,
            startDate: c.startDate?.toISOString() ?? "",
            endDate: c.endDate?.toISOString() ?? "",
            createdAt: c.createdAt.toISOString(),
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
          orderBy: { createdAt: "desc" },
        });
        return this.toCsv(
          tasks.map((t) => ({
            id: t.id,
            title: t.title,
            project: t.project?.name ?? "",
            assignee: t.assignee?.name ?? "",
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate?.toISOString() ?? "",
            revisionCount: t.revisionCount,
            createdAt: t.createdAt.toISOString(),
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
        throw new BadRequestException(
          `Export type "${type}" is not supported. Supported types: users, clients, invoices, audit-log, requests, contracts, tasks`,
        );
    }
  }

  // ── Backup tracking via SystemEventLog ──────────────────────────────

  async triggerBackup(triggeredBy: string) {
    const startedAt = new Date();

    const startedEvent = await this.prisma.systemEventLog.create({
      data: {
        eventType: "BACKUP_STARTED",
        source: "admin.backups.trigger",
        message: `Database backup started by admin`,
        metadata: { triggeredBy, startedAt: startedAt.toISOString() },
        status: "OPEN",
      },
    });

    // Attempt pg_dump via exec (non-blocking)
    const dbUrl = process.env.DATABASE_URL || "";
    const backupDir = process.env.BACKUP_DIR || "/tmp/backups";

    return new Promise<any>((resolvePromise) => {
      const { exec } = require("child_process");
      const timestamp = startedAt.toISOString().replace(/[:.]/g, "-");
      const filename = `hassad_backup_${timestamp}.sql`;
      const filepath = `${backupDir}/${filename}`;

      exec(
        `mkdir -p ${backupDir} && pg_dump "${dbUrl}" > "${filepath}" 2>/dev/null; echo "EXIT:$?"`,
        {
          timeout: 300000,
          maxBuffer: 500 * 1024 * 1024,
        },
        async (error: any, stdout: string) => {
          const exitMatch = stdout?.match(/EXIT:(\d+)/);
          const exitCode = exitMatch ? parseInt(exitMatch[1]) : error ? 1 : 0;

          if (exitCode === 0) {
            const stats = await this.getFileSize(filepath);
            await this.prisma.$transaction([
              this.prisma.systemEventLog.create({
                data: {
                  eventType: "BACKUP_COMPLETED",
                  source: "admin.backups.trigger",
                  message: `Database backup completed successfully`,
                  metadata: {
                    triggeredBy,
                    filename,
                    filepath,
                    sizeBytes: stats.size,
                    durationMs: Date.now() - startedAt.getTime(),
                    startedAt: startedAt.toISOString(),
                  },
                  status: "RESOLVED",
                  resolvedAt: new Date(),
                  resolvedBy: triggeredBy,
                },
              }),
              this.prisma.systemEventLog.update({
                where: { id: startedEvent.id },
                data: {
                  status: "RESOLVED",
                  resolvedAt: new Date(),
                  resolvedBy: triggeredBy,
                },
              }),
            ]);
            resolvePromise({
              success: true,
              filename,
              filepath,
              size: stats.size,
            });
          } else {
            const errMsg =
              error?.message || `pg_dump exited with code ${exitCode}`;
            await this.prisma.$transaction([
              this.prisma.systemEventLog.create({
                data: {
                  eventType: "BACKUP_FAILED",
                  source: "admin.backups.trigger",
                  message: `Database backup failed: ${errMsg}`,
                  metadata: {
                    triggeredBy,
                    error: errMsg,
                    startedAt: startedAt.toISOString(),
                  },
                  status: "OPEN",
                },
              }),
              this.prisma.systemEventLog.update({
                where: { id: startedEvent.id },
                data: {
                  status: "RESOLVED",
                  resolvedAt: new Date(),
                  resolvedBy: triggeredBy,
                },
              }),
            ]);
            resolvePromise({ success: false, error: errMsg });
          }
        },
      );
    });
  }

  private getFileSize(filepath: string): Promise<{ size: number }> {
    return new Promise((resolve) => {
      const fs = require("fs");
      fs.stat(filepath, (err: any, stats: any) => {
        resolve({ size: err ? 0 : stats.size });
      });
    });
  }

  async getBackupHistory(limit = 20) {
    return this.prisma.systemEventLog.findMany({
      where: {
        eventType: {
          in: [
            "BACKUP_STARTED",
            "BACKUP_COMPLETED",
            "BACKUP_FAILED",
            "BACKUP_RESTORE",
          ] as any,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getBackupStatus() {
    const [latest, completedCount, failedCount] = await Promise.all([
      this.prisma.systemEventLog.findFirst({
        where: {
          eventType: { in: ["BACKUP_COMPLETED", "BACKUP_FAILED"] as any },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.systemEventLog.count({
        where: { eventType: "BACKUP_COMPLETED" },
      }),
      this.prisma.systemEventLog.count({
        where: { eventType: "BACKUP_FAILED" },
      }),
    ]);

    const inProgress = await this.prisma.systemEventLog.count({
      where: { eventType: "BACKUP_STARTED", status: "OPEN" },
    });

    return {
      lastBackup: latest
        ? {
            status:
              latest.eventType === "BACKUP_COMPLETED" ? "completed" : "failed",
            timestamp: latest.createdAt.toISOString(),
            metadata: latest.metadata,
          }
        : null,
      stats: {
        totalCompleted: completedCount,
        totalFailed: failedCount,
        inProgress,
      },
    };
  }

  private toCsv(data: Record<string, any>[], fields: string[]): string {
    const header = fields.join(",");
    const rows = data.map((row) =>
      fields
        .map((f) => {
          const val = row[f];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    );
    return "\uFEFF" + [header, ...rows].join("\n");
  }
}
