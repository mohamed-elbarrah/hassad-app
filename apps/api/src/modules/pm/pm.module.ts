import { Module } from "@nestjs/common";

import { ChatModule } from "../chat/chat.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProjectPeriodsModule } from "../projects/project-periods.module";
import { TasksModule } from "../tasks/tasks.module";
import { StorageModule } from "../../common/storage/storage.module";
import { CrmModule } from "../crm/crm.module";
import { PmChatController } from "./controllers/pm-chat.controller";
import { PmChatService } from "./services/pm-chat.service";
import { PmClientsController } from "./controllers/pm-clients.controller";
import { PmProjectsController } from "./controllers/pm-projects.controller";
import { PmProjectActionsController } from "./controllers/pm-project-actions.controller";
import { PmTasksController } from "./controllers/pm-tasks.controller";
import { PmClientsService } from "./services/pm-clients.service";
import { PmProjectsService } from "./services/pm-projects.service";
import { PmProjectActionsService } from "./services/pm-project-actions.service";
import { PmTasksService } from "./services/pm-tasks.service";

@Module({
  imports: [ChatModule, NotificationsModule, ProjectPeriodsModule, TasksModule, StorageModule, CrmModule],
  controllers: [PmChatController, PmClientsController, PmProjectsController, PmProjectActionsController, PmTasksController],
  providers: [PmChatService, PmClientsService, PmProjectsService, PmProjectActionsService, PmTasksService],
  exports: [PmChatService, PmClientsService, PmProjectsService, PmProjectActionsService, PmTasksService],
})
export class PmModule {}
