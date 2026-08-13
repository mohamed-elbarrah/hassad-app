import { Module } from "@nestjs/common";

import { ChatModule } from "../chat/chat.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProjectPeriodsModule } from "../projects/project-periods.module";
import { TasksModule } from "../tasks/tasks.module";
import { StorageModule } from "../../common/storage/storage.module";
import { PmChatController } from "./controllers/pm-chat.controller";
import { PmChatService } from "./services/pm-chat.service";
import { PmProjectsController } from "./controllers/pm-projects.controller";
import { PmProjectActionsController } from "./controllers/pm-project-actions.controller";
import { PmProjectsService } from "./services/pm-projects.service";
import { PmProjectActionsService } from "./services/pm-project-actions.service";

@Module({
  imports: [ChatModule, NotificationsModule, ProjectPeriodsModule, TasksModule, StorageModule],
  controllers: [PmChatController, PmProjectsController, PmProjectActionsController],
  providers: [PmChatService, PmProjectsService, PmProjectActionsService],
  exports: [PmChatService, PmProjectsService, PmProjectActionsService],
})
export class PmModule {}
