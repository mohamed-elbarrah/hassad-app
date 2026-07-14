import {
  AiProvider,
  AiOptions,
  AiResult,
  AiProviderConfig,
} from "./provider.interface";

export class OpenAICompatibleAdapter implements AiProvider {
  readonly name: string;
  readonly displayName: string;
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.name = config.name;
    this.displayName = config.displayName || config.name;
  }

  isAvailable(): boolean {
    return this.config.isActive && !!this.config.apiKey;
  }

  supportedModels(): string[] {
    return this.config.models;
  }

  async listModels(): Promise<string[]> {
    const baseUrl = (
      this.config.baseUrl || "https://api.openai.com/v1"
    ).replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
    if (!response.ok)
      throw new Error(`Failed to fetch models (${response.status})`);
    const json = (await response.json()) as { data: Array<{ id: string }> };
    return json.data.map((m) => m.id).sort();
  }

  async generateText(prompt: string, options?: AiOptions): Promise<AiResult> {
    const baseUrl = (
      this.config.baseUrl || "https://api.openai.com/v1"
    ).replace(/\/+$/, "");
    const model = options?.model || this.config.models[0] || "gpt-4o";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "unknown error");
      throw new Error(
        `OpenAI-compatible API error (${response.status}): ${errBody}`,
      );
    }

    const json = (await response.json()) as {
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number };
      choices: Array<{ message: { content: string } }>;
    };

    return {
      text: json.choices?.[0]?.message?.content || "",
      model: json.model || model,
      usage: json.usage
        ? {
            promptTokens: json.usage.prompt_tokens,
            completionTokens: json.usage.completion_tokens,
          }
        : undefined,
    };
  }
}
