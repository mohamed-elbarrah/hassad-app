import { describe, expect, it } from "vitest";
import { AiProviderError, classifyProviderError, isSafeCustomBaseUrl } from "./provider.interface";

describe("isSafeCustomBaseUrl", () => {
  it("accepts an HTTPS provider URL without credentials or query data", () => {
    expect(isSafeCustomBaseUrl("https://api.example.com/v1")).toBe(true);
    expect(isSafeCustomBaseUrl(undefined)).toBe(true);
  });

  it.each([
    "http://api.example.com/v1",
    "https://user:password@api.example.com/v1",
    "https://api.example.com/v1?token=secret",
    "https://127.0.0.1/v1",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/v1",
    "https://service.internal/v1",
    "not a URL",
  ])("rejects unsafe provider URL %s", (value) => {
    expect(isSafeCustomBaseUrl(value)).toBe(false);
  });
});

describe("classifyProviderError", () => {
  it.each([[401, "AUTHENTICATION_FAILED"], [403, "PERMISSION_DENIED"], [429, "RATE_LIMITED"], [503, "UPSTREAM_UNAVAILABLE"]] as const)("normalizes HTTP %s", (status, code) => {
    const error = classifyProviderError({ status });
    expect(error).toBeInstanceOf(AiProviderError);
    expect(error.code).toBe(code);
    expect(error.retryable).toBe(status === 429 || status === 503);
  });

  it("normalizes network failures without preserving the message", () => {
    const error = classifyProviderError(new TypeError("secret endpoint details"));
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toBe("NETWORK_ERROR");
  });
});
