import { isIP } from "node:net";

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

export interface AiModelInfo {
  id: string;
  displayName?: string;
  contextWindow?: number;
}

export interface AiProviderCapabilities {
  textGeneration: boolean;
  modelListing: boolean;
  streaming: boolean;
}

export type AiProviderErrorCode =
  | "AUTHENTICATION_FAILED"
  | "PERMISSION_DENIED"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "UPSTREAM_UNAVAILABLE"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "PROVIDER_CONFIGURATION_ERROR"
  | "UNKNOWN";

export class AiProviderError extends Error {
  readonly providerId?: string;
  readonly cause?: unknown;
  readonly retryable: boolean;
  readonly status?: number;

  constructor(
    readonly code: AiProviderErrorCode,
    options: { providerId?: string; status?: number; retryable?: boolean; cause?: unknown } = {},
  ) {
    super(code);
    this.name = "AiProviderError";
    this.providerId = options.providerId;
    this.status = options.status;
    if (options.cause !== undefined) this.cause = options.cause;
    this.retryable = options.retryable ?? isRetryableProviderStatus(options.status, code);
  }
}

export function isRetryableProviderStatus(status?: number, code?: AiProviderErrorCode): boolean {
  return code === "RATE_LIMITED" || code === "UPSTREAM_UNAVAILABLE" || code === "TIMEOUT" || code === "NETWORK_ERROR" ||
    status === 408 || status === 409 || status === 425 || status === 429 || (status !== undefined && status >= 500);
}

/** Normalize adapter/upstream failures without exposing upstream messages or secrets. */
export function classifyProviderError(error: unknown): AiProviderError {
  if (error instanceof AiProviderError) return error;
  const status = error && typeof error === "object" && "status" in error && typeof error.status === "number"
    ? error.status : undefined;
  if (status === 401) return new AiProviderError("AUTHENTICATION_FAILED", { status });
  if (status === 403) return new AiProviderError("PERMISSION_DENIED", { status });
  if (status === 408 || status === 409 || status === 425 || status === 429)
    return new AiProviderError(status === 429 ? "RATE_LIMITED" : "UPSTREAM_UNAVAILABLE", { status });
  if (status !== undefined && status >= 500)
    return new AiProviderError("UPSTREAM_UNAVAILABLE", { status });
  if (status !== undefined && status >= 400 && status < 500)
    return new AiProviderError("INVALID_REQUEST", { status });
  if (error instanceof DOMException && error.name === "TimeoutError") return new AiProviderError("TIMEOUT");
  if (error && typeof error === "object" && "name" in error && (error.name === "TimeoutError" || error.name === "AbortError")) return new AiProviderError("TIMEOUT");
  if (error instanceof TypeError) return new AiProviderError("NETWORK_ERROR");
  return new AiProviderError("UNKNOWN", { status });
}

export interface AiProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly capabilities: AiProviderCapabilities;
  generateText(prompt: string, options?: AiOptions): Promise<AiResult>;
  isAvailable(): boolean;
  supportedModels(): string[];
  modelInfo(): AiModelInfo[];
  listModels(): Promise<string[]>;
}

/** Validate provider-controlled URLs before they reach fetch. */
export function isSafeCustomBaseUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (url.protocol !== "https:" || !hostname || url.username || url.password || url.search || url.hash) return false;
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname === "metadata.google.internal") return false;
    const ipVersion = isIP(hostname);
    const mappedIpv4 = hostname.match(/^::ffff:(\d+(?:\.\d+){3})$/);
    if (mappedIpv4 && !isSafeCustomBaseUrl(`https://${mappedIpv4[1]}`)) return false;
    if (ipVersion === 4) {
      const [first, second] = hostname.split(".").map(Number);
      if (first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)) return false;
    }
    if (ipVersion === 6 && (hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe8") || hostname.startsWith("fe9") || hostname.startsWith("fea") || hostname.startsWith("feb"))) return false;
    return true;
  } catch { return false; }
}

export interface AiProviderConfig {
  id: string; name: string; displayName: string | null; baseUrl: string | null; apiKey: string; models: string[]; priority: number; isActive: boolean;
  requestsPerMinute: number | null; tokensPerMinute: number | null; maxTokens: number | null; temperature: number | null;
}
export type AiProviderFactory = (config: AiProviderConfig) => AiProvider;
