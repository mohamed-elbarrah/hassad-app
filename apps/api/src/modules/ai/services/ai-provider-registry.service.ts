import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { EncryptionService } from "../encryption/encryption.service";
import {
  AiProvider,
  AiProviderConfig,
  AiResult,
  AiOptions,
} from "../adapters/provider.interface";
import { ADAPTER_FACTORIES } from "../adapters/adapter-factory";

@Injectable()
export class AiProviderRegistry implements OnModuleInit {
  private readonly logger = new Logger(AiProviderRegistry.name);
  private providers: AiProvider[] = [];
  private rateLimits = new Map<string, { requestsPerMinute: number | null }>();
  private usageMap = new Map<string, { requestTimestamps: number[] }>();

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async onModuleInit() {
    await this.refresh();
  }

  async refresh() {
    try {
      const rows = await this.prisma.aiProvider.findMany({
        where: { isActive: true },
        orderBy: { priority: "asc" },
      });

      this.providers = [];
      this.rateLimits.clear();

      for (const row of rows) {
        const factory = ADAPTER_FACTORIES[row.name];
        if (!factory) {
          this.logger.warn(`No adapter for provider "${row.name}" — skipping`);
          continue;
        }

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

        this.rateLimits.set(row.name, {
          requestsPerMinute: row.requestsPerMinute,
        });
        this.providers.push(factory(config));
      }

      this.logger.log(`Loaded ${this.providers.length} AI provider(s)`);
    } catch (err) {
      this.logger.error("Failed to load AI providers", err);
      this.providers = [];
    }
  }

  getPrimary(): AiProvider | null {
    return this.providers.find((p) => p.isAvailable()) || null;
  }

  getActive(): AiProvider[] {
    return this.providers.filter((p) => p.isAvailable());
  }

  getAll(): AiProvider[] {
    return [...this.providers];
  }

  async generateWithFallback(
    prompt: string,
    options?: AiOptions,
  ): Promise<AiResult> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;
      if (this.isRateLimited(provider.name)) continue;

      try {
        const result = await provider.generateText(prompt, options);
        this.recordUsage(provider.name);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(
          `Provider "${provider.name}" failed: ${lastError.message}`,
        );
      }
    }

    throw lastError || new Error("No AI providers available");
  }

  private isRateLimited(providerName: string): boolean {
    const limit = this.rateLimits.get(providerName);
    if (!limit || !limit.requestsPerMinute) return false;

    const usage = this.usageMap.get(providerName);
    if (!usage) return false;

    const oneMinuteAgo = Date.now() - 60_000;
    const recentRequests = usage.requestTimestamps.filter(
      (t) => t > oneMinuteAgo,
    );
    return recentRequests.length >= limit.requestsPerMinute;
  }

  private recordUsage(providerName: string) {
    const entry = this.usageMap.get(providerName) || { requestTimestamps: [] };
    entry.requestTimestamps.push(Date.now());
    this.usageMap.set(providerName, entry);
  }
}
