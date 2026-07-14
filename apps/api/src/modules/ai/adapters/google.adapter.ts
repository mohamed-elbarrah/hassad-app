import {
  AiProvider,
  AiOptions,
  AiResult,
  AiProviderConfig,
} from "./provider.interface";

export class GoogleAdapter implements AiProvider {
  readonly name: string;
  readonly displayName: string;
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.name = config.name;
    this.displayName = config.displayName || "Google (Gemini)";
  }

  isAvailable(): boolean {
    return this.config.isActive && !!this.config.apiKey;
  }

  supportedModels(): string[] {
    return this.config.models;
  }

  async listModels(): Promise<string[]> {
    const baseUrl = (
      this.config.baseUrl || "https://generativelanguage.googleapis.com"
    ).replace(/\/+$/, "");
    const response = await fetch(
      `${baseUrl}/v1beta/models?key=${this.config.apiKey}`,
    );
    if (!response.ok)
      throw new Error(`Failed to fetch models (${response.status})`);
    const json = (await response.json()) as { models: Array<{ name: string }> };
    return json.models
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((name) => !name.startsWith("upload") && !name.startsWith("tuned"))
      .sort();
  }

  async generateText(prompt: string, options?: AiOptions): Promise<AiResult> {
    const model = options?.model || this.config.models[0] || "gemini-2.0-flash";
    const baseUrl = (
      this.config.baseUrl || "https://generativelanguage.googleapis.com"
    ).replace(/\/+$/, "");

    const response = await fetch(
      `${baseUrl}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    if (!response.ok) {
      const errBody = await response.text().catch(() => "unknown error");
      throw new Error(`Google AI API error (${response.status}): ${errBody}`);
    }

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
}
