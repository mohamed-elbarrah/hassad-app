import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { StorageModule } from "../../common/storage/storage.module";
import { CurrencySettingsController } from "./controllers/currency-settings.controller";
import { CurrencySettingsService } from "./services/currency-settings.service";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [CurrencySettingsController],
  providers: [CurrencySettingsService],
  exports: [CurrencySettingsService],
})
export class SettingsModule {}
