import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ProjectsController } from "./controllers/projects.controller";
import { ProjectsService } from "./services/projects.service";
import { ProjectPeriodsModule } from "./project-periods.module";
import { TasksModule } from "../tasks/tasks.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CrmModule } from "../crm/crm.module";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [
    ProjectPeriodsModule,
    TasksModule,
    NotificationsModule,
    CrmModule,
    ChatModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
