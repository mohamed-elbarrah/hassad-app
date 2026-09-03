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
  DEFAULT_BASE_URLS,
  DEFAULT_MODELS,
  SUPPORTED_PROVIDERS,
} from "../adapters/adapter-factory";
import {
  isSafeCustomBaseUrl,
  type AiProviderConfig,
} from "../adapters/provider.interface";
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
    if (!row)
      throw new NotFoundException({
        code: "AI_PROVIDER_NOT_FOUND",
        details: {},
      });
    return this.maskKey(row);
  }

  getSupportedProviders() {
    return SUPPORTED_PROVIDERS;
  }

  async create(data: Prisma.AiProviderCreateInput) {
    this.assertSupportedProvider(data.name);
    const baseUrl = this.getBaseUrl(data.name, data.baseUrl);
    this.assertSafeBaseUrl(baseUrl);
    const row = await this.prisma.aiProvider.create({
      data: {
        ...data,
        baseUrl,
        apiKey: this.encryption.encrypt(data.apiKey),
      },
    });
    await this.registry.refresh();
    return this.maskKey(row);
  }

  async update(id: string, data: Prisma.AiProviderUpdateInput) {
    const existing = await this.findOne(id);
    this.assertSupportedProvider(existing.name);

    const updateData = { ...data } as Record<string, unknown>;
    const baseUrl = this.getBaseUrl(
      existing.name,
      typeof data.baseUrl === "string" ? data.baseUrl : existing.baseUrl,
    );
    this.assertSafeBaseUrl(baseUrl);
    if (
      data.baseUrl == null ||
      (typeof data.baseUrl === "string" && data.baseUrl.trim() === "")
    ) {
      updateData.baseUrl = baseUrl;
    }
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

  getRegistryStatus() {
    return this.registry.getStatus();
  }

  async testProvider(id: string): Promise<{ text: string; model: string }> {
    const row = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!row)
      throw new NotFoundException({
        code: "AI_PROVIDER_NOT_FOUND",
        details: {},
      });

    const factory = ADAPTER_FACTORIES[row.name];
    if (!factory)
      throw new BadRequestException({
        code: "UNSUPPORTED_AI_PROVIDER",
        details: { name: row.name },
      });

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
    if (!row)
      throw new NotFoundException({
        code: "AI_PROVIDER_NOT_FOUND",
        details: {},
      });

    const factory = ADAPTER_FACTORIES[row.name];
    if (!factory)
      throw new BadRequestException({
        code: "UNSUPPORTED_AI_PROVIDER",
        details: { name: row.name },
      });

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

  private getBaseUrl(
    providerName: string,
    baseUrl: string | null | undefined,
  ): string {
    return baseUrl?.trim() || DEFAULT_BASE_URLS[providerName] || "";
  }

  private assertSafeBaseUrl(baseUrl: string | null | undefined): void {
    if (!isSafeCustomBaseUrl(baseUrl)) {
      throw new BadRequestException({
        code: "UNSAFE_AI_PROVIDER_BASE_URL",
        details: {},
      });
    }
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
