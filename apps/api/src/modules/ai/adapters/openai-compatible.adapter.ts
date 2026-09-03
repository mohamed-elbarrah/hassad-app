import {
  AiProvider, AiOptions, AiResult, AiProviderConfig, AiModelInfo,
  AiProviderCapabilities, AiProviderError, isSafeCustomBaseUrl,
} from "./provider.interface";

export interface OpenAICompatibleAdapterConfig { defaultBaseUrl: string }

export class OpenAICompatibleAdapter implements AiProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly capabilities: AiProviderCapabilities = { textGeneration: true, modelListing: true, streaming: false };
  protected readonly config: AiProviderConfig;
  private readonly adapterConfig: OpenAICompatibleAdapterConfig;

  constructor(config: AiProviderConfig, adapterConfig: OpenAICompatibleAdapterConfig = { defaultBaseUrl: "https://api.openai.com/v1" }) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.displayName = config.displayName || config.name;
    this.adapterConfig = config.name === "openrouter" && adapterConfig.defaultBaseUrl === "https://api.openai.com/v1"
      ? { defaultBaseUrl: "https://openrouter.ai/api/v1" }
      : adapterConfig;
  }
  isAvailable(): boolean { return this.config.isActive && !!this.config.apiKey; }
  supportedModels(): string[] { return [...this.config.models]; }
  modelInfo(): AiModelInfo[] { return this.supportedModels().map((id) => ({ id })); }

  async listModels(): Promise<string[]> {
    const response = await this.request(`${this.getBaseUrl()}/models`);
    const json = (await response.json()) as { data?: Array<{ id: string }> };
    return (json.data || []).map((m) => m.id).sort();
  }
  async generateText(prompt: string, options?: AiOptions): Promise<AiResult> {
    const model = options?.model || this.config.models[0] || "gpt-4o";
    const response = await this.request(`${this.getBaseUrl()}/chat/completions`, {
      method: "POST", body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: options?.temperature ?? this.config.temperature ?? 0.7, max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096 }),
    });
    const json = (await response.json()) as { model: string; usage?: { prompt_tokens: number; completion_tokens: number }; choices: Array<{ message: { content: string } }> };
    return { text: json.choices?.[0]?.message?.content || "", model: json.model || model, usage: json.usage ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens } : undefined };
  }
  protected getBaseUrl(): string {
    if (!isSafeCustomBaseUrl(this.config.baseUrl)) throw new AiProviderError("PROVIDER_CONFIGURATION_ERROR");
    return (this.config.baseUrl || this.adapterConfig.defaultBaseUrl).replace(/\/+$/, "");
  }
  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    try {
      const response = await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(10_000), headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}`, ...(init.headers || {}) } });
      if (!response.ok) throw new AiProviderError(response.status === 401 ? "AUTHENTICATION_FAILED" : response.status === 403 ? "PERMISSION_DENIED" : response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INVALID_REQUEST", { status: response.status });
      return response;
    } catch (error) { throw error instanceof AiProviderError ? error : new AiProviderError("NETWORK_ERROR", { cause: error }); }
  }
}

export class OpenAIAdapter extends OpenAICompatibleAdapter {
  constructor(config: AiProviderConfig) { super(config, { defaultBaseUrl: "https://api.openai.com/v1" }); }
}
export class OpenRouterAdapter extends OpenAICompatibleAdapter {
  constructor(config: AiProviderConfig) { super(config, { defaultBaseUrl: "https://openrouter.ai/api/v1" }); }
}
