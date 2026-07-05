import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminEnvironmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getInfo() {
    const [dbVersion, pendingMigrations, externalServices, settingsCount] =
      await Promise.all([
        this.prisma.$queryRawUnsafe<Array<{ version: string }>>(
          "SELECT version() as version",
        ),
        this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          "SELECT COUNT(*) as count FROM _prisma_migrations WHERE applied_steps_count = 0",
        ),
        this.prisma.externalServiceHealth.findMany({
          orderBy: { lastCheckedAt: "desc" },
        }),
        this.prisma.companySetting.count(),
      ]);

    return {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      dbVersion: dbVersion[0]?.version ?? "unknown",
      pendingMigrations: Number(pendingMigrations[0]?.count ?? 0),
      externalServices,
      settingsCount,
      timestamp: new Date().toISOString(),
    };
  }
}
