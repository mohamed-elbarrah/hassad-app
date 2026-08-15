import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminTeamService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkload() {
    const items = await this.prisma.staffWorkload.findMany({
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { calculatedAt: "desc" },
    });

    const mapped = items.map((w) => ({
      userId: w.user.id,
      userName: w.user.name,
      activeTasksCount: w.activeTasksCount,
      workloadStatus: w.workloadStatus,
      avgCompletionSpeedDays: w.avgCompletionSpeedDays,
      avgQualityScore: w.avgQualityScore,
    }));

    const summary = {
      available: items.filter((w) => w.workloadStatus === "AVAILABLE").length,
      busy: items.filter((w) => w.workloadStatus === "BUSY").length,
      overloaded: items.filter((w) => w.workloadStatus === "OVERLOADED").length,
    };

    return { items: mapped, summary };
  }

  async getWorkloadByUser(userId: string) {
    const workload = await this.prisma.staffWorkload.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    if (!workload) throw new NotFoundException("Workload data not found");
    return workload;
  }
}
