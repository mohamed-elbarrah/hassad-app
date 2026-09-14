import { Module, forwardRef } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { ChatModule } from "../chat/chat.module";
import { CanonicalClientService } from "./canonical-client.service";
import { RequestsController } from "./requests.controller";
import { RequestsService } from "./requests.service";
import { SalesAssignmentService } from "./sales-assignment.service";
import { AuthModule } from "../../auth/auth.module";

@Module({
  imports: [NotificationsModule, ChatModule, forwardRef(() => AuthModule)],
  controllers: [RequestsController],
  providers: [RequestsService, CanonicalClientService, SalesAssignmentService],
  exports: [RequestsService, CanonicalClientService, SalesAssignmentService],
})
export class RequestsModule {}
