import {
  AiProvider,
  AiOptions,
  AiResult,
  AiProviderConfig,
  AiModelInfo,
  AiProviderCapabilities,
  AiProviderError,
  isSafeCustomBaseUrl,
} from "./provider.interface";

export class AnthropicAdapter implements AiProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly capabilities: AiProviderCapabilities = { textGeneration: true, modelListing: true, streaming: false };
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.displayName = config.displayName || "Anthropic (Claude)";
  }

  isAvailable(): boolean {
    return this.config.isActive && !!this.config.apiKey;
  }

  supportedModels(): string[] {
    return [...this.config.models];
  }

  modelInfo(): AiModelInfo[] {
    return this.supportedModels().map((id) => ({ id }));
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.getBaseUrl()}/models`, {
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
    if (!response.ok) throw new AiProviderError(response.status === 401 ? "AUTHENTICATION_FAILED" : response.status === 403 ? "PERMISSION_DENIED" : response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INVALID_REQUEST", { status: response.status });
    const json = (await response.json()) as { data: Array<{ id: string }> };
    return json.data.map((m) => m.id).sort();
  }

  async generateText(prompt: string, options?: AiOptions): Promise<AiResult> {
    const model =
      options?.model || this.config.models[0] || "claude-sonnet-4-20250514";

    const response = await fetch(`${this.getBaseUrl()}/messages`, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new AiProviderError(response.status === 401 ? "AUTHENTICATION_FAILED" : response.status === 403 ? "PERMISSION_DENIED" : response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INVALID_REQUEST", { status: response.status });

    const json = (await response.json()) as {
      model: string;
      content: Array<{ text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    return {
      text: json.content?.map((c) => c.text).join("") || "",
      model: json.model || model,
      usage: json.usage
        ? {
            promptTokens: json.usage.input_tokens,
            completionTokens: json.usage.output_tokens,
          }
        : undefined,
    };
  }

  private getBaseUrl(): string {
    if (!isSafeCustomBaseUrl(this.config.baseUrl)) {
      throw new Error("UNSAFE_AI_PROVIDER_BASE_URL");
    }
    return (this.config.baseUrl || "https://api.anthropic.com/v1").replace(
      /\/+$/,
      "",
    );
  }
}
