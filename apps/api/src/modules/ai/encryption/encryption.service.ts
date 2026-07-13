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
    const secret = this.config.get<string>("KEY_ENCRYPTION_SECRET");
    if (secret) {
      this.key = crypto.scryptSync(secret, "hassad-ai-provider-salt", KEY_LENGTH);
    } else {
      this.logger.warn("KEY_ENCRYPTION_SECRET not set — API keys will be stored in plaintext");
    }
  }

  encrypt(plaintext: string): string {
    if (!this.key) return plaintext;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${tag}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    if (!this.key) return ciphertext;
    const parts = ciphertext.split(":");
    if (parts.length !== 3) return ciphertext;
    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}
