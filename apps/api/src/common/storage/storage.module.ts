import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { ChatAttachmentService } from "./chat-attachment.service";

@Global()
@Module({
  providers: [StorageService, ChatAttachmentService],
  exports: [StorageService, ChatAttachmentService],
})
export class StorageModule {}
