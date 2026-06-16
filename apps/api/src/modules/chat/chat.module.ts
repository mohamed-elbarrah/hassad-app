import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ChatController } from "./controllers/chat.controller";
import { ChatService } from "./services/chat.service";
import { AutoConversationService } from "./services/auto-conversation.service";
import { ProjectTeamConversationService } from "./services/project-team-conversation.service";
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
    AutoConversationService,
    ProjectTeamConversationService,
    ChatGateway,
  ],
  exports: [
    ChatService,
    AutoConversationService,
    ProjectTeamConversationService,
  ],
})
export class ChatModule {}
