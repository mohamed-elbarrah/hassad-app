import { AiProviderConfig, AiProvider } from "./provider.interface";
import { OpenAICompatibleAdapter } from "./openai-compatible.adapter";
import { AnthropicAdapter } from "./anthropic.adapter";
import { GoogleAdapter } from "./google.adapter";

export const ADAPTER_FACTORIES: Record<string, (config: AiProviderConfig) => AiProvider> = {
  openai: (c) => new OpenAICompatibleAdapter(c),
  openrouter: (c) => new OpenAICompatibleAdapter({ ...c, displayName: c.displayName || "OpenRouter" }),
  anthropic: (c) => new AnthropicAdapter(c),
  google: (c) => new GoogleAdapter(c),
};

export const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini"],
  openrouter: ["openai/gpt-4o", "anthropic/claude-sonnet-4", "google/gemini-2.0-flash"],
  anthropic: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
};
