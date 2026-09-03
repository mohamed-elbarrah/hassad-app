import { describe, expect, it, vi } from "vitest";
import { AiProviderError } from "../adapters/provider.interface";
import { AiProviderRegistry } from "./ai-provider-registry.service";

const row = (id: string, name: string, apiKey: string) => ({ id, name, displayName: null, baseUrl: null, apiKey, models: ["gpt-4o"], priority: 1, isActive: true, requestsPerMinute: null, tokensPerMinute: null, maxTokens: null, temperature: null });

describe("AiProviderRegistry", () => {
  it("falls back after a primary authentication failure", async () => {
    const registry = new AiProviderRegistry({} as never, {} as never);
    const primary = {
      id: "primary", isAvailable: () => true,
      generateText: vi.fn().mockRejectedValue(new AiProviderError("AUTHENTICATION_FAILED")),
    };
    const fallback = {
      id: "fallback", isAvailable: () => true,
      generateText: vi.fn().mockResolvedValue({ text: "ok", model: "fallback-model" }),
    };
    (registry as any).providers = [primary, fallback];

    await expect(registry.generateWithFallback("prompt")).resolves.toEqual({ text: "ok", model: "fallback-model" });
    expect(primary.generateText).toHaveBeenCalledOnce();
    expect(fallback.generateText).toHaveBeenCalledOnce();
  });

  it("returns the most useful normalized error after every provider fails", async () => {
    const registry = new AiProviderRegistry({} as never, {} as never);
    const primary = {
      id: "primary", isAvailable: () => true,
      generateText: vi.fn().mockRejectedValue({ status: 401, secret: "must-not-leak" }),
    };
    const fallback = {
      id: "fallback", isAvailable: () => true,
      generateText: vi.fn().mockRejectedValue({ status: 503 }),
    };
    (registry as any).providers = [primary, fallback];

    const error = await registry.generateWithFallback("prompt").catch((value) => value);

    expect(error).toBeInstanceOf(AiProviderError);
    expect(error.code).toBe("AUTHENTICATION_FAILED");
    expect(error.providerId).toBe("primary");
    expect(error.message).toBe("AUTHENTICATION_FAILED");
    expect(error.message).not.toContain("must-not-leak");
  });

  it("keeps valid providers when another provider key cannot be loaded", async () => {
    const prisma = { aiProvider: { findMany: vi.fn().mockResolvedValue([row("bad", "openai", "bad-key"), row("good", "openai", "good-key")]) } };
    const encryption = { decrypt: vi.fn((value: string) => { if (value === "bad-key") throw new Error("invalid ciphertext"); return "decrypted"; }) };
    const registry = new AiProviderRegistry(prisma as never, encryption as never);

    await registry.refresh();

    expect(registry.getAll()).toHaveLength(1);
    expect(registry.getAll()[0].id).toBe("good");
    expect(registry.getStatus()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "bad", status: "failed", reasonCode: "AI_PROVIDER_CONFIGURATION_FAILED" }),
      expect.objectContaining({ id: "good", status: "loaded" }),
    ]));
  });
});
