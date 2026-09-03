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

export class GoogleAdapter implements AiProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly capabilities: AiProviderCapabilities = { textGeneration: true, modelListing: true, streaming: false };
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.displayName = config.displayName || "Google (Gemini)";
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
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/v1beta/models`, {
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: { "x-goog-api-key": this.config.apiKey },
    });
    if (!response.ok) throw new AiProviderError(response.status === 401 ? "AUTHENTICATION_FAILED" : response.status === 403 ? "PERMISSION_DENIED" : response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INVALID_REQUEST", { status: response.status });
    const json = (await response.json()) as { models: Array<{ name: string }> };
    return json.models
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((name) => !name.startsWith("upload") && !name.startsWith("tuned"))
      .sort();
  }

  async generateText(prompt: string, options?: AiOptions): Promise<AiResult> {
    const model = options?.model || this.config.models[0] || "gemini-2.0-flash";
    const baseUrl = this.getBaseUrl();

    const response = await fetch(
      `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.config.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? this.config.temperature ?? 0.7,
            maxOutputTokens:
              options?.maxTokens ?? this.config.maxTokens ?? 4096,
          },
        }),
      },
    );

    if (!response.ok) throw new AiProviderError(response.status === 401 ? "AUTHENTICATION_FAILED" : response.status === 403 ? "PERMISSION_DENIED" : response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INVALID_REQUEST", { status: response.status });

    const json = (await response.json()) as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
      };
    };

    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

    return {
      text,
      model,
      usage: json.usageMetadata
        ? {
            promptTokens: json.usageMetadata.promptTokenCount,
            completionTokens: json.usageMetadata.candidatesTokenCount,
          }
        : undefined,
    };
  }

  private getBaseUrl(): string {
    if (!isSafeCustomBaseUrl(this.config.baseUrl)) {
      throw new Error("UNSAFE_AI_PROVIDER_BASE_URL");
    }
    return (
      this.config.baseUrl || "https://generativelanguage.googleapis.com"
    ).replace(/\/+$/, "");
  }
}
