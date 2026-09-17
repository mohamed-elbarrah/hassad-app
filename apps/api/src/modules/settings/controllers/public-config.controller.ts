import { Controller, Get } from "@nestjs/common";
import { Public } from "../../../common/decorators/public.decorator";
import { IntegrationsSettingsService } from "../services/integrations-settings.service";

@Controller("public/config")
export class PublicConfigController {
  constructor(private readonly service: IntegrationsSettingsService) {}

  @Public()
  @Get()
  get() {
    return this.service.getPublicConfig();
  }
}
