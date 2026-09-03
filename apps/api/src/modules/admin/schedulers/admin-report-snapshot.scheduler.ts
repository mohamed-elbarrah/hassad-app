import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ReportPeriod } from "@prisma/client";
import { AdminReportsService } from "../services/admin-reports.service";

/** Generates at most one full snapshot for each closed reporting period per run. */
@Injectable()
export class AdminReportSnapshotScheduler {
  private readonly logger = new Logger(AdminReportSnapshotScheduler.name);
  private static readonly REPORT_TYPE = "all";

  constructor(private readonly reportsService: AdminReportsService) {}

  @Cron("15 3 * * *")
  async generateClosedPeriodSnapshots(): Promise<void> {
    const now = new Date();
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    );
    const currentWeekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay(),
    );
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentYearStart = new Date(now.getFullYear(), 0, 1);

    const periods: Array<{ period: ReportPeriod; referenceDate: Date }> = [
      {
        period: "WEEKLY",
        referenceDate: new Date(currentWeekStart.getTime() - 1),
      },
      {
        period: "MONTHLY",
        referenceDate: new Date(currentMonthStart.getTime() - 1),
      },
      {
        period: "YEARLY",
        referenceDate: new Date(currentYearStart.getTime() - 1),
      },
    ];

    for (const { period, referenceDate } of periods) {
      try {
        const snapshot = await this.reportsService.saveSnapshot(
          AdminReportSnapshotScheduler.REPORT_TYPE,
          period,
          referenceDate,
        );
        this.logger.log(`${period} report snapshot ready: ${snapshot.id}`);
      } catch (error) {
        // One failed aggregation must not prevent the other periods from running.
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`${period} report snapshot failed: ${message}`);
      }
    }
  }
}
