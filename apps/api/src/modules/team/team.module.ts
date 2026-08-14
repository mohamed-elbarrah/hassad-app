import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

import { ChatModule } from "../chat/chat.module";
import { TasksModule } from "../tasks/tasks.module";
import { CrmModule } from "../crm/crm.module";
import { TeamChatController } from "./controllers/team-chat.controller";
import { TeamChatService } from "./services/team-chat.service";
import { TeamTasksController } from "./controllers/team-tasks.controller";
import { TeamTasksService } from "./services/team-tasks.service";
import { ClientProfileService } from "../crm/services/client-profile.service";

@Module({
  imports: [
    ChatModule,
    TasksModule,
    CrmModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [TeamChatController, TeamTasksController],
  providers: [TeamChatService, TeamTasksService],
  exports: [TeamChatService, TeamTasksService],
})
export class TeamModule {}
