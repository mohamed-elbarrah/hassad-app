import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import {
  PortalDisputesController,
  PmDisputesController,
  AdminDisputesController,
} from "./controllers";
import { DisputesService } from "./services";

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5,
      },
    }),
  ],
  controllers: [PortalDisputesController, PmDisputesController, AdminDisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}