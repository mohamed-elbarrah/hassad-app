import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { ChatModule } from "../chat/chat.module";
import { CanonicalClientService } from "./canonical-client.service";
import { RequestsController } from "./requests.controller";
import { RequestsService } from "./requests.service";
import { SalesAssignmentService } from "./sales-assignment.service";

@Module({
  imports: [NotificationsModule, ChatModule],
  controllers: [RequestsController],
  providers: [RequestsService, CanonicalClientService, SalesAssignmentService],
  exports: [RequestsService, CanonicalClientService, SalesAssignmentService],
})
export class RequestsModule {}
