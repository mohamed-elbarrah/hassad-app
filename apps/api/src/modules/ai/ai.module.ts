import { Module } from "@nestjs/common";
import { AiController } from "./controllers/ai.controller";
import { AiProviderController } from "./controllers/ai-provider.controller";
import { AiService } from "./services/ai.service";
import { AiProviderService } from "./services/ai-provider.service";
import { AiProviderRegistry } from "./services/ai-provider-registry.service";
import { EncryptionService } from "./encryption/encryption.service";

@Module({
  controllers: [AiController, AiProviderController],
  providers: [
    AiService,
    AiProviderService,
    AiProviderRegistry,
    EncryptionService,
  ],
  exports: [AiService, AiProviderRegistry, EncryptionService],
})
export class AiModule {}
