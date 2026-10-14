import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { TasksController } from "./controllers/tasks.controller";
import { TasksService } from "./services/tasks.service";
import { TaskAccessPolicyService } from "./services/task-access-policy.service";
import { ProjectPeriodsModule } from "../projects/project-periods.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [
    ProjectPeriodsModule,
    NotificationsModule,
    ChatModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskAccessPolicyService],
  exports: [TasksService, TaskAccessPolicyService],
})
export class TasksModule {}
