import { Module } from "@nestjs/common";

import { ChatModule } from "../chat/chat.module";
import { PmChatController } from "./controllers/pm-chat.controller";
import { PmChatService } from "./services/pm-chat.service";

@Module({
  imports: [ChatModule],
  controllers: [PmChatController],
  providers: [PmChatService],
  exports: [PmChatService],
})
export class PmModule {}
