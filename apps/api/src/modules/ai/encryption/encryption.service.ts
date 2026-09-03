import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private key: Buffer | null = null;

  constructor(private config: ConfigService) {
    const secret = this.config.get<string>("KEY_ENCRYPTION_SECRET")?.trim();
    if (!secret) {
      if (this.config.get<string>("NODE_ENV") === "production") {
        throw new Error(
          "KEY_ENCRYPTION_SECRET is required in production; refusing to start without provider-key encryption",
        );
      }

      // Never fall back to plaintext. An ephemeral development key keeps this
      // process safe, while making the loss of the secret visible at restart.
      this.logger.warn(
        "KEY_ENCRYPTION_SECRET is not set; using an ephemeral key for this process",
      );
      this.key = crypto.randomBytes(KEY_LENGTH);
      return;
    }

    this.key = crypto.scryptSync(secret, "hassad-ai-provider-salt", KEY_LENGTH);
  }

  encrypt(plaintext: string): string {
    if (!this.key) {
      throw new Error("AI provider encryption is not configured");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${tag}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!this.key) {
      throw new Error("AI provider encryption is not configured");
    }
    const parts = ciphertext.split(":");
    const [ivHex, tagHex, encrypted] = parts;
    if (
      parts.length !== 3 ||
      !/^[0-9a-f]+$/i.test(ivHex) ||
      !/^[0-9a-f]+$/i.test(tagHex) ||
      !/^[0-9a-f]*$/i.test(encrypted) ||
      ivHex.length !== IV_LENGTH * 2 ||
      tagHex.length !== TAG_LENGTH * 2
    ) {
      throw new Error("AI_PROVIDER_KEY_NOT_ENCRYPTED");
    }
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}
