import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { ChatAttachmentService } from "./chat-attachment.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { R2ConfigProvider } from "./r2-config.provider";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [R2ConfigProvider, StorageService, ChatAttachmentService],
  exports: [R2ConfigProvider, StorageService, ChatAttachmentService],
})
export class StorageModule {}
