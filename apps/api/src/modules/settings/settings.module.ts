import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { StorageModule } from "../../common/storage/storage.module";
import { CurrencySettingsController } from "./controllers/currency-settings.controller";
import { CurrencySettingsService } from "./services/currency-settings.service";
import { IntegrationsSettingsService } from "./services/integrations-settings.service";
import { PublicConfigController } from "./controllers/public-config.controller";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [CurrencySettingsController, PublicConfigController],
  providers: [CurrencySettingsService, IntegrationsSettingsService],
  exports: [CurrencySettingsService, IntegrationsSettingsService],
})
export class SettingsModule {}
