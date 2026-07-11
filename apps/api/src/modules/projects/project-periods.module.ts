import { Module } from "@nestjs/common";
import { ProjectPeriodsService } from "./services/project-periods.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { FinanceModule } from "../finance/finance.module";

/**
 * ProjectPeriodsModule — owns the monthly period lifecycle for retainer projects.
 * Kept as its own module so both ProjectsModule (PM endpoints + portal timeline)
 * and TasksModule (auto-link new tasks to the active period) can import it
 * without creating a circular dependency.
 */
@Module({
  imports: [NotificationsModule, FinanceModule],
  providers: [ProjectPeriodsService],
  exports: [ProjectPeriodsService],
})
export class ProjectPeriodsModule {}
