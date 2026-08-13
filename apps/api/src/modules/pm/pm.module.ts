import { Module } from "@nestjs/common";

import { ChatModule } from "../chat/chat.module";
import { PmChatController } from "./controllers/pm-chat.controller";
import { PmChatService } from "./services/pm-chat.service";
import { PmProjectsController } from "./controllers/pm-projects.controller";
import { PmProjectsService } from "./services/pm-projects.service";

@Module({
  imports: [ChatModule],
  controllers: [PmChatController, PmProjectsController],
  providers: [PmChatService, PmProjectsService],
  exports: [PmChatService, PmProjectsService],
})
export class PmModule {}
