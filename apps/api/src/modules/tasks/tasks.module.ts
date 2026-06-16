import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { TasksController } from "./controllers/tasks.controller";
import { TasksService } from "./services/tasks.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [
    NotificationsModule,
    ChatModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
