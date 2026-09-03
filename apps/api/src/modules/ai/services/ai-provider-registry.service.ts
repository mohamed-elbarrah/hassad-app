import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { EncryptionService } from "../encryption/encryption.service";
import {
  AiProvider, AiProviderConfig, AiResult, AiOptions, AiProviderError,
  classifyProviderError,
} from "../adapters/provider.interface";
import { ADAPTER_FACTORIES } from "../adapters/adapter-factory";

export interface AiProviderStatus {
  id: string;
  name: string;
  displayName: string | null;
  priority: number;
  status: "loaded" | "failed" | "unsupported";
  reasonCode?: string;
}

@Injectable()
export class AiProviderRegistry implements OnModuleInit {
  private readonly logger = new Logger(AiProviderRegistry.name);
  private providers: AiProvider[] = [];
  private statuses: AiProviderStatus[] = [];
  private rateLimits = new Map<string, { requestsPerMinute: number | null }>();
  private usageMap = new Map<string, { requestTimestamps: number[] }>();

  constructor(private prisma: PrismaService, private encryption: EncryptionService) {}
  async onModuleInit() { await this.refresh(); }

  async refresh() {
    const rows = await this.prisma.aiProvider.findMany({ where: { isActive: true }, orderBy: { priority: "asc" } });
    const providers: AiProvider[] = [];
    const statuses: AiProviderStatus[] = [];
    const limits = new Map<string, { requestsPerMinute: number | null }>();
    for (const row of rows) {
      const base = { id: row.id, name: row.name, displayName: row.displayName, priority: row.priority };
      const factory = ADAPTER_FACTORIES[row.name];
      if (!factory) {
        statuses.push({ ...base, status: "unsupported", reasonCode: "UNSUPPORTED_AI_PROVIDER" });
        this.logger.warn(`No adapter for provider type "${row.name}" — skipping`);
        continue;
      }
      try {
        const config: AiProviderConfig = { id: row.id, name: row.name, displayName: row.displayName, baseUrl: row.baseUrl, apiKey: this.encryption.decrypt(row.apiKey), models: row.models, priority: row.priority, isActive: row.isActive, requestsPerMinute: row.requestsPerMinute, tokensPerMinute: row.tokensPerMinute, maxTokens: row.maxTokens, temperature: row.temperature };
        providers.push(factory(config));
        limits.set(row.id, { requestsPerMinute: row.requestsPerMinute });
        statuses.push({ ...base, status: "loaded" });
      } catch (error) {
        // Deliberately log only a stable code; adapter/encryption errors may contain sensitive data.
        const normalized = classifyProviderError(error);
        statuses.push({ ...base, status: "failed", reasonCode: normalized.code === "UNKNOWN" ? "AI_PROVIDER_CONFIGURATION_FAILED" : normalized.code });
        this.logger.warn(`Provider "${row.name}" (${row.id}) was not loaded: ${statuses.at(-1)?.reasonCode}`);
      }
    }
    this.providers = providers;
    this.statuses = statuses;
    this.rateLimits = limits;
    this.logger.log(`Loaded ${providers.length} AI provider(s)`);
  }

  getPrimary() { return this.providers.find((provider) => this.isProviderAvailable(provider)) || null; }
  getActive() { return this.providers.filter((provider) => this.isProviderAvailable(provider)); }
  getAll() { return [...this.providers]; }
  getStatus(): AiProviderStatus[] { return this.statuses.map((status) => ({ ...status })); }

  async generateWithFallback(prompt: string, options?: AiOptions): Promise<AiResult> {
    let mostUsefulError: AiProviderError | null = null;
    for (const provider of this.providers) {
      let available = false;
      try {
        available = provider.isAvailable();
      } catch (error) {
        const normalized = this.normalizeProviderError(error, provider.id);
        mostUsefulError = this.selectMostUsefulError(mostUsefulError, normalized);
        this.logger.warn(`Provider "${provider.id}" failed (${normalized.code})`);
        continue;
      }
      if (!available || this.isRateLimited(provider.id)) continue;

      try {
        const result = await provider.generateText(prompt, options);
        this.recordUsage(provider.id);
        return result;
      } catch (error) {
        const normalized = this.normalizeProviderError(error, provider.id);
        mostUsefulError = this.selectMostUsefulError(mostUsefulError, normalized);
        // Continue for every normalized provider failure. Auth, configuration,
        // and request errors are isolated to this provider and must not prevent
        // a healthy fallback from serving the request.
        this.logger.warn(`Provider "${provider.id}" failed (${normalized.code})`);
      }
    }
    throw mostUsefulError || new AiProviderError("UPSTREAM_UNAVAILABLE");
  }

  private isProviderAvailable(provider: AiProvider): boolean {
    try {
      return provider.isAvailable();
    } catch (error) {
      const normalized = this.normalizeProviderError(error, provider.id);
      this.logger.warn(`Provider "${provider.id}" failed (${normalized.code})`);
      return false;
    }
  }

  private normalizeProviderError(error: unknown, providerId: string): AiProviderError {
    const normalized = classifyProviderError(error);
    return normalized.providerId
      ? normalized
      : new AiProviderError(normalized.code, {
        providerId,
        status: normalized.status,
        retryable: normalized.retryable,
        cause: normalized,
      });
  }

  private selectMostUsefulError(current: AiProviderError | null, candidate: AiProviderError) {
    if (!current || this.errorPriority(candidate) > this.errorPriority(current)) return candidate;
    return current;
  }

  private errorPriority(error: AiProviderError) {
    // Stable, actionable failures explain why no provider could serve the
    // request better than a transient failure from a later provider.
    const priorities: Record<string, number> = {
      PROVIDER_CONFIGURATION_ERROR: 60,
      AUTHENTICATION_FAILED: 50,
      PERMISSION_DENIED: 45,
      INVALID_REQUEST: 40,
      RATE_LIMITED: 30,
      UPSTREAM_UNAVAILABLE: 20,
      TIMEOUT: 20,
      NETWORK_ERROR: 15,
      UNKNOWN: 10,
    };
    return priorities[error.code] ?? 0;
  }

  private isRateLimited(providerId: string) {
    const limit = this.rateLimits.get(providerId);
    if (!limit?.requestsPerMinute) return false;
    const usage = this.usageMap.get(providerId);
    if (!usage) return false;
    usage.requestTimestamps = usage.requestTimestamps.filter((t) => t > Date.now() - 60_000);
    return usage.requestTimestamps.length >= limit.requestsPerMinute;
  }
  private recordUsage(providerId: string) {
    const entry = this.usageMap.get(providerId) || { requestTimestamps: [] };
    entry.requestTimestamps.push(Date.now());
    this.usageMap.set(providerId, entry);
  }
}
