import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  BadGatewayException,
  HttpException,
} from "@nestjs/common";
import { AiProviderService } from "../services/ai-provider.service";
import { ADAPTER_FACTORIES, DEFAULT_MODELS } from "../adapters/adapter-factory";
import {
  CreateAiProviderDto,
  UpdateAiProviderDto,
  FetchModelsDto,
} from "../dto/ai-provider.dto";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("admin/ai/providers")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiProviderController {
  constructor(private readonly service: AiProviderService) {}

  @Get()
  @RequirePermissions("admin.ai.read")
  findAll() {
    return this.service.findAll();
  }

  @Get("supported")
  @RequirePermissions("admin.ai.read")
  getSupportedProviders() {
    return this.service.getSupportedProviders();
  }

  @Get("status")
  @RequirePermissions("admin.ai.read")
  getStatus() {
    return this.service.getRegistryStatus();
  }

  @Get(":id")
  @RequirePermissions("admin.ai.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post("fetch-models")
  @RequirePermissions("admin.ai.manage")
  async fetchModelsPreview(@Body() dto: FetchModelsDto) {
    const factory = ADAPTER_FACTORIES[dto.name];
    if (!factory)
      throw new BadRequestException({
        code: "UNSUPPORTED_AI_PROVIDER",
        details: { name: dto.name },
      });

    const config = {
      id: "preview",
      name: dto.name,
      displayName: dto.name,
      baseUrl: dto.baseUrl || null,
      apiKey: dto.apiKey,
      models: [],
      priority: 0,
      isActive: true,
      requestsPerMinute: null,
      tokensPerMinute: null,
      maxTokens: null,
      temperature: null,
    };

    try {
      const adapter = factory(config);
      const models = await adapter.listModels();
      return { models };
    } catch {
      throw new BadGatewayException({
        code: "AI_PROVIDER_REQUEST_FAILED",
        details: { models: DEFAULT_MODELS[dto.name] || [] },
      });
    }
  }

  @Post()
  @RequirePermissions("admin.ai.manage")
  create(@Body() dto: CreateAiProviderDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("admin.ai.manage")
  update(@Param("id") id: string, @Body() dto: UpdateAiProviderDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("admin.ai.manage")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Get(":id/models")
  @RequirePermissions("admin.ai.read")
  async listModels(@Param("id") id: string) {
    try {
      const models = await this.service.fetchModels(id);
      return { models };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const defaults = await this.service.getDefaultModels(
        (await this.service.findOne(id)).name,
      );
      throw new BadGatewayException({
        code: "AI_PROVIDER_REQUEST_FAILED",
        details: { models: defaults },
      });
    }
  }

  @Post(":id/test")
  @RequirePermissions("admin.ai.manage")
  async test(@Param("id") id: string) {
    try {
      const result = await this.service.testProvider(id);
      return { model: result.model, response: result.text };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadGatewayException({
        code: "AI_PROVIDER_REQUEST_FAILED",
        details: {},
      });
    }
  }
}
