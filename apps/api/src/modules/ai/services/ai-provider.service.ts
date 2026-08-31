import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { EncryptionService } from "../encryption/encryption.service";
import { AiProviderRegistry } from "./ai-provider-registry.service";
import {
  ADAPTER_FACTORIES,
  DEFAULT_MODELS,
  SUPPORTED_PROVIDERS,
} from "../adapters/adapter-factory";
import type { AiProviderConfig } from "../adapters/provider.interface";
import { AiProvider as AiProviderType, Prisma } from "@prisma/client";

type ProviderJson = Omit<AiProviderType, "apiKey"> & { apiKey: string };

@Injectable()
export class AiProviderService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private registry: AiProviderRegistry,
  ) {}

  async findAll() {
    const rows = await this.prisma.aiProvider.findMany({
      orderBy: { priority: "asc" },
    });
    return rows.map((row) => this.maskKey(row));
  }

  async findOne(id: string) {
    const row = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("AI provider not found");
    return this.maskKey(row);
  }

  getSupportedProviders() {
    return SUPPORTED_PROVIDERS;
  }

  async create(data: Prisma.AiProviderCreateInput) {
    this.assertSupportedProvider(data.name);
    const row = await this.prisma.aiProvider.create({
      data: {
        ...data,
        apiKey: this.encryption.encrypt(data.apiKey),
      },
    });
    await this.registry.refresh();
    return this.maskKey(row);
  }

  async update(id: string, data: Prisma.AiProviderUpdateInput) {
    await this.findOne(id);

    const updateData = { ...data } as Record<string, unknown>;
    if (typeof data.apiKey === "string") {
      updateData.apiKey = this.encryption.encrypt(data.apiKey);
    }

    const row = await this.prisma.aiProvider.update({
      where: { id },
      data: updateData,
    });
    await this.registry.refresh();
    return this.maskKey(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.aiProvider.delete({ where: { id } });
    await this.registry.refresh();
  }

  async refreshRegistry() {
    await this.registry.refresh();
  }

  async testProvider(id: string): Promise<{ text: string; model: string }> {
    const row = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("AI provider not found");

    const factory = ADAPTER_FACTORIES[row.name];
    if (!factory)
      throw new BadRequestException(
        `No adapter for provider type "${row.name}"`,
      );

    const apiKey = this.encryption.decrypt(row.apiKey);

    const config: AiProviderConfig = {
      id: row.id,
      name: row.name,
      displayName: row.displayName,
      baseUrl: row.baseUrl,
      apiKey,
      models: row.models,
      priority: row.priority,
      isActive: row.isActive,
      requestsPerMinute: row.requestsPerMinute,
      tokensPerMinute: row.tokensPerMinute,
      maxTokens: row.maxTokens,
      temperature: row.temperature,
    };

    const adapter = factory(config);
    const result = await adapter.generateText("Respond with only the word: OK");
    return { text: result.text, model: result.model };
  }

  async fetchModels(id: string): Promise<string[]> {
    const row = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("AI provider not found");

    const factory = ADAPTER_FACTORIES[row.name];
    if (!factory)
      throw new BadRequestException(
        `No adapter for provider type "${row.name}"`,
      );

    const apiKey = this.encryption.decrypt(row.apiKey);

    const config: AiProviderConfig = {
      id: row.id,
      name: row.name,
      displayName: row.displayName,
      baseUrl: row.baseUrl,
      apiKey,
      models: row.models,
      priority: row.priority,
      isActive: row.isActive,
      requestsPerMinute: row.requestsPerMinute,
      tokensPerMinute: row.tokensPerMinute,
      maxTokens: row.maxTokens,
      temperature: row.temperature,
    };

    const adapter = factory(config);
    return adapter.listModels();
  }

  getDefaultModels(type: string): string[] {
    return DEFAULT_MODELS[type] || [];
  }

  private assertSupportedProvider(name: string): void {
    if (!Object.prototype.hasOwnProperty.call(ADAPTER_FACTORIES, name)) {
      throw new BadRequestException({
        code: "UNSUPPORTED_AI_PROVIDER",
        details: {
          name,
          supportedProviders: Object.keys(ADAPTER_FACTORIES),
        },
      });
    }
  }

  private maskKey(row: AiProviderType): ProviderJson {
    return {
      ...row,
      apiKey: row.apiKey ? "••••••••" + row.apiKey.slice(-4) : "",
    };
  }
}
