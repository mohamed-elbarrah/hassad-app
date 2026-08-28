import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrencySettingsService } from "../services/currency-settings.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

/**
 * Shared read-only compatibility endpoint. Currency management belongs to the
 * Admin module; consumers that only need the active default do not need admin
 * permissions.
 */
@Controller("currency-settings")
@UseGuards(JwtAuthGuard)
export class CurrencySettingsController {
  constructor(private readonly service: CurrencySettingsService) {}

  @Get("default")
  findDefault() {
    return this.service.findDefault();
  }
}
