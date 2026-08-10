import { Module } from "@nestjs/common";

import { ChatModule } from "../chat/chat.module";
import { TeamChatController } from "./controllers/team-chat.controller";
import { TeamChatService } from "./services/team-chat.service";

@Module({
  imports: [ChatModule],
  controllers: [TeamChatController],
  providers: [TeamChatService],
  exports: [TeamChatService],
})
export class TeamModule {}
