import { AiProvider, AiOptions, AiResult, AiProviderConfig } from "./provider.interface";

export class AnthropicAdapter implements AiProvider {
  readonly name: string;
  readonly displayName: string;
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.name = config.name;
    this.displayName = config.displayName || "Anthropic (Claude)";
  }

  isAvailable(): boolean {
    return this.config.isActive && !!this.config.apiKey;
  }

  supportedModels(): string[] {
    return this.config.models;
  }

  async generateText(prompt: string, options?: AiOptions): Promise<AiResult> {
    const model = options?.model || this.config.models[0] || "claude-sonnet-4-20250514";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
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

    if (!response.ok) {
      const errBody = await response.text().catch(() => "unknown error");
      throw new Error(`Anthropic API error (${response.status}): ${errBody}`);
    }

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
}
