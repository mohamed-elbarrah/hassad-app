import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ChatController } from "./controllers/chat.controller";
import { ChatService } from "./services/chat.service";
import { ChatPresenceService } from "./services/chat-presence.service";
import { DirectConversationService } from "./services/direct-conversation.service";
import { ProjectGroupChatService } from "./services/project-group-chat.service";
import { ChatGateway } from "./gateway/chat.gateway";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev-secret",
      signOptions: { expiresIn: "1h" },
    }),
    NotificationsModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatPresenceService,
    DirectConversationService,
    ProjectGroupChatService,
    ChatGateway,
  ],
  exports: [ChatService, ChatPresenceService, DirectConversationService, ProjectGroupChatService],
})
export class ChatModule {}
