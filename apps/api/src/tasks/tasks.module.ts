import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

/**
 * TasksModule — encapsulates the Task Management feature.
 * PrismaModule is @Global(), so PrismaService is available without a local import.
 * Does NOT import ProjectsModule — uses PrismaService directly for project checks.
 */
@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
