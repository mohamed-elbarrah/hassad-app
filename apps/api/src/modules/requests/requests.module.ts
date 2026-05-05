import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { CanonicalClientService } from "./canonical-client.service";
import { RequestsController } from "./requests.controller";
import { RequestsService } from "./requests.service";

@Module({
  imports: [NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService, CanonicalClientService],
  exports: [RequestsService, CanonicalClientService],
})
export class RequestsModule {}
