import { describe, expect, it, vi } from "vitest";
import { OpenRouterAdapter } from "./openai-compatible.adapter";
import type { AiProviderConfig } from "./provider.interface";

const config: AiProviderConfig = { id: "or-1", name: "openrouter", displayName: null, baseUrl: null, apiKey: "key", models: ["openai/gpt-4o"], priority: 1, isActive: true, requestsPerMinute: null, tokensPerMinute: null, maxTokens: null, temperature: null };

describe("OpenRouterAdapter", () => {
  it("uses OpenRouter's base URL when no custom URL is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await new OpenRouterAdapter(config).listModels();
    expect(fetchMock.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/models");
    vi.unstubAllGlobals();
  });
});
