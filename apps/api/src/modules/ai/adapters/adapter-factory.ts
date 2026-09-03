import { AiProviderConfig, AiProvider } from "./provider.interface";
import { OpenAIAdapter, OpenRouterAdapter } from "./openai-compatible.adapter";
import { AnthropicAdapter } from "./anthropic.adapter";
import { GoogleAdapter } from "./google.adapter";

export const ADAPTER_FACTORIES: Record<
  string,
  (config: AiProviderConfig) => AiProvider
> = {
  openai: (c) => new OpenAIAdapter(c),
  openrouter: (c) => new OpenRouterAdapter({ ...c, displayName: c.displayName || "OpenRouter" }),
  anthropic: (c) => new AnthropicAdapter(c),
  google: (c) => new GoogleAdapter(c),
};

export const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com",
};

export const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini"],
  openrouter: [
    "openai/gpt-4o",
    "anthropic/claude-sonnet-4",
    "google/gemini-2.0-flash",
  ],
  anthropic: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
};

/**
 * The provider catalog is derived from the adapters and model defaults so that
 * the API cannot advertise a provider that the runtime cannot instantiate.
 */
const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  anthropic: "Anthropic",
  google: "Google",
};

export interface SupportedAiProvider {
  name: string;
  label: string;
  defaultBaseUrl: string;
  defaultModels: string[];
}

export const SUPPORTED_PROVIDERS: SupportedAiProvider[] = Object.keys(
  ADAPTER_FACTORIES,
).map((name) => ({
  name,
  label: PROVIDER_LABELS[name] ?? name,
  defaultBaseUrl: DEFAULT_BASE_URLS[name],
  defaultModels: DEFAULT_MODELS[name] ?? [],
}));
