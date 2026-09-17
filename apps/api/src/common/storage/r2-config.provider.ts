import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { isIP } from "node:net";

export interface R2Config {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicDomain?: string;
}

const R2_SETTING_KEY = "integration.r2";
const ENCRYPTED_PREFIX = "v1";

export function classifyR2ConnectionError(error: unknown): string {
  const status =
    typeof error === "object" &&
    error !== null &&
    "$metadata" in error &&
    typeof error.$metadata === "object" &&
    error.$metadata !== null &&
    "httpStatusCode" in error.$metadata
      ? error.$metadata.httpStatusCode
      : undefined;

  if (status === 401 || status === 403) return "R2_AUTHENTICATION_FAILED";
  if (status === 404) return "R2_BUCKET_NOT_FOUND";

  const name = error instanceof Error ? error.name : "";
  const errorCode =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;
  const causeCode =
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "code" in error.cause
      ? error.cause.code
      : undefined;
  if (
    [
      "ENOTFOUND",
      "EAI_AGAIN",
      "ECONNREFUSED",
      "ECONNRESET",
      "ENETUNREACH",
      "ETIMEDOUT",
      "TimeoutError",
      "NetworkingError",
    ].includes(String(errorCode ?? causeCode ?? name))
  ) {
    return "R2_CONNECTION_UNAVAILABLE";
  }

  return "R2_CONNECTION_FAILED";
}

export function isSafePublicDomainHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    isIP(normalized) === 0 &&
    normalized !== "localhost" &&
    !normalized.endsWith(".localhost") &&
    !normalized.endsWith(".local") &&
    !normalized.endsWith(".internal")
  );
}

/** Database-backed R2 configuration with environment compatibility fallback. */
@Injectable()
export class R2ConfigProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getDatabaseConfig(): Promise<Partial<R2Config>> {
    const setting = await this.prisma.companySetting.findUnique({
      where: { key: R2_SETTING_KEY },
    });
    const value = setting?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const raw = value as Record<string, unknown>;
    return {
      endpoint: typeof raw.endpoint === "string" ? raw.endpoint : undefined,
      bucket: typeof raw.bucket === "string" ? raw.bucket : undefined,
      publicDomain: this.sanitizePublicDomain(raw.publicDomain),
      accessKey: this.decrypt(raw.accessKey),
      secretKey: this.decrypt(raw.secretKey),
    };
  }

  async getStoredMetadata(): Promise<{
    endpoint?: string;
    bucket?: string;
    publicDomain?: string;
    hasEncryptedCredentials: boolean;
  }> {
    const setting = await this.prisma.companySetting.findUnique({
      where: { key: R2_SETTING_KEY },
    });
    const value = setting?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { hasEncryptedCredentials: false };
    }
    const raw = value as Record<string, unknown>;
    return {
      endpoint: typeof raw.endpoint === "string" ? raw.endpoint : undefined,
      bucket: typeof raw.bucket === "string" ? raw.bucket : undefined,
      publicDomain: this.sanitizePublicDomain(raw.publicDomain),
      hasEncryptedCredentials:
        typeof raw.accessKey === "string" && typeof raw.secretKey === "string",
    };
  }

  async getEffectiveConfig(): Promise<Partial<R2Config>> {
    const database = await this.getDatabaseConfig();
    const databaseComplete = !!(
      database.endpoint &&
      database.bucket &&
      database.accessKey &&
      database.secretKey
    );
    if (databaseComplete) {
      return {
        ...database,
        publicDomain: database.publicDomain,
      };
    }
    return {
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      bucket: process.env.CLOUDFLARE_R2_BUCKET,
      accessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY,
      secretKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
      publicDomain: this.sanitizePublicDomain(
        process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN,
      ),
    };
  }

  async save(config: {
    endpoint?: string;
    bucket?: string;
    publicDomain?: string | null;
    accessKey?: string;
    secretKey?: string;
  }): Promise<void> {
    const setting = await this.prisma.companySetting.findUnique({
      where: { key: R2_SETTING_KEY },
    });
    const stored =
      setting?.value &&
      typeof setting.value === "object" &&
      !Array.isArray(setting.value)
        ? (setting.value as Record<string, unknown>)
        : {};
    const replacingCompleteCredentials = Boolean(
      config.endpoint && config.bucket && config.accessKey && config.secretKey,
    );
    const current = replacingCompleteCredentials
      ? {}
      : await this.getEffectiveConfig();
    const value: Record<string, string> = {};

    for (const key of ["endpoint", "bucket", "publicDomain"] as const) {
      if (key === "publicDomain" && config.publicDomain === null) continue;
      const next = config[key] ?? stored[key] ?? current[key];
      if (typeof next === "string" && next) value[key] = next;
    }

    const replacingCredentials =
      config.accessKey !== undefined || config.secretKey !== undefined;
    if (replacingCredentials) {
      if (!config.accessKey || !config.secretKey) {
        throw new Error("R2_CREDENTIALS_REQUIRED");
      }
      value.accessKey = this.encrypt(config.accessKey);
      value.secretKey = this.encrypt(config.secretKey);
    } else if (
      typeof stored.accessKey === "string" &&
      typeof stored.secretKey === "string"
    ) {
      value.accessKey = stored.accessKey;
      value.secretKey = stored.secretKey;
    } else if (current.accessKey && current.secretKey) {
      // Migrate a complete environment configuration into encrypted database
      // storage when the admin first saves database-backed R2 settings.
      value.accessKey = this.encrypt(current.accessKey);
      value.secretKey = this.encrypt(current.secretKey);
    }

    await this.prisma.companySetting.upsert({
      where: { key: R2_SETTING_KEY },
      create: { key: R2_SETTING_KEY, value },
      update: { value },
    });
  }

  private sanitizePublicDomain(value: unknown): string | undefined {
    if (typeof value !== "string" || !value) return undefined;

    try {
      const url = new URL(value);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash ||
        !isSafePublicDomainHost(url.hostname)
      ) {
        return undefined;
      }
      return url.origin;
    } catch {
      return undefined;
    }
  }

  private encryptionKey(): Buffer {
    const raw = process.env.SETTINGS_ENCRYPTION_KEY;
    if (!raw) throw new Error("SETTINGS_ENCRYPTION_KEY_MISSING");
    if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) return decoded;
    throw new Error("SETTINGS_ENCRYPTION_KEY_INVALID");
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    return `${ENCRYPTED_PREFIX}:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ciphertext.toString("base64")}`;
  }

  private decrypt(value: unknown): string | undefined {
    if (typeof value !== "string" || !value) return undefined;
    const [version, ivText, tagText, dataText] = value.split(":");
    if (version !== ENCRYPTED_PREFIX || !ivText || !tagText || !dataText)
      throw new Error("SETTINGS_DECRYPTION_FAILED");
    try {
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.encryptionKey(),
        Buffer.from(ivText, "base64"),
      );
      decipher.setAuthTag(Buffer.from(tagText, "base64"));
      return Buffer.concat([
        decipher.update(Buffer.from(dataText, "base64")),
        decipher.final(),
      ]).toString("utf8");
    } catch (error) {
      throw new Error(
        error instanceof Error &&
          error.message.startsWith("SETTINGS_ENCRYPTION_KEY")
          ? error.message
          : "SETTINGS_DECRYPTION_FAILED",
      );
    }
  }
}
