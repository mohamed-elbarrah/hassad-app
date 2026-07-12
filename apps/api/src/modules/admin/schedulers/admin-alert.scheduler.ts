import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AdminAlertService } from "../services/admin-alert.service";

@Injectable()
export class AdminAlertScheduler {
  private readonly logger = new Logger(AdminAlertScheduler.name);

  constructor(private readonly alertService: AdminAlertService) {}

  @Cron("*/30 * * * *")
  async runAlertChecks() {
    this.logger.log("Running scheduled alert checks...");
    const results = await this.alertService.runAll();
    this.logger.log(`Alert checks complete: ${JSON.stringify(results)}`);
  }
}
