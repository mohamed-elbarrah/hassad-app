export interface AiOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiResult {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AiProvider {
  readonly name: string;
  readonly displayName: string;
  generateText(prompt: string, options?: AiOptions): Promise<AiResult>;
  isAvailable(): boolean;
  supportedModels(): string[];
}

export interface AiProviderConfig {
  id: string;
  name: string;
  displayName: string | null;
  baseUrl: string | null;
  apiKey: string;
  models: string[];
  priority: number;
  isActive: boolean;
  requestsPerMinute: number | null;
  tokensPerMinute: number | null;
  maxTokens: number | null;
  temperature: number | null;
}

export type AiProviderFactory = (config: AiProviderConfig) => AiProvider;
