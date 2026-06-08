import { Module } from "@nestjs/common";
import { CurrencySettingsController } from "./controllers/currency-settings.controller";
import { CurrencySettingsService } from "./services/currency-settings.service";

@Module({
  controllers: [CurrencySettingsController],
  providers: [CurrencySettingsService],
  exports: [CurrencySettingsService],
})
export class SettingsModule {}
