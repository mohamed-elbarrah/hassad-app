import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../../common/storage/storage.service";
import {
  classifyR2ConnectionError,
  isSafePublicDomainHost,
  R2Config,
  R2ConfigProvider,
} from "../../../common/storage/r2-config.provider";
import { R2SettingsDto, UpdateIntegrationsDto } from "../dto/integrations.dto";

const WHATSAPP_KEY = "integration.whatsapp";

@Injectable()
export class IntegrationsSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2ConfigProvider,
    private readonly storage: StorageService,
  ) {}

  async getAdminSettings() {
    const whatsapp = await this.getWhatsappPhone();
    let config: Partial<R2Config>;
    let hasCredentials = false;

    try {
      config = await this.getEffectiveR2Config();
      hasCredentials = !!(config.accessKey && config.secretKey);
    } catch {
      const metadata = await this.r2.getStoredMetadata();
      config = metadata;
      // An undecryptable credential must be replaced, not reused.
      hasCredentials = false;
    }

    return {
      whatsappPhone: whatsapp,
      whatsappUrl: whatsapp ? this.whatsappUrl(whatsapp) : null,
      r2: {
        endpoint: config.endpoint ?? null,
        bucket: config.bucket ?? null,
        publicDomain: config.publicDomain ?? null,
        hasCredentials,
      },
    };
  }

  async update(dto: UpdateIntegrationsDto) {
    if (dto.whatsappPhone !== undefined) {
      const phone =
        dto.whatsappPhone === null || dto.whatsappPhone.trim() === ""
          ? null
          : this.normalizePhone(dto.whatsappPhone);
      await this.prisma.companySetting.upsert({
        where: { key: WHATSAPP_KEY },
        create: { key: WHATSAPP_KEY, value: phone },
        update: { value: phone },
      });
    }
    if (dto.r2) {
      this.validateR2(dto.r2);
      const replacingCredentials =
        dto.r2.accessKey !== undefined || dto.r2.secretKey !== undefined;
      const replacingCompleteConfiguration = Boolean(
        dto.r2.endpoint &&
        dto.r2.bucket &&
        dto.r2.accessKey &&
        dto.r2.secretKey,
      );
      const effective = replacingCompleteConfiguration
        ? {}
        : await this.getEffectiveR2Config();
      const stored = replacingCompleteConfiguration
        ? {}
        : await this.getDatabaseR2Config();
      if (replacingCredentials && (!dto.r2.accessKey || !dto.r2.secretKey)) {
        throw new BadRequestException({
          code: "R2_CREDENTIALS_REQUIRED",
          details: {},
        });
      }
      const hasComplete =
        !!(dto.r2.endpoint ?? effective.endpoint) &&
        !!(dto.r2.bucket ?? effective.bucket) &&
        !!(dto.r2.accessKey ?? stored.accessKey ?? effective.accessKey) &&
        !!(dto.r2.secretKey ?? stored.secretKey ?? effective.secretKey);
      if (!process.env.SETTINGS_ENCRYPTION_KEY) {
        throw new BadRequestException({
          code: "SETTINGS_ENCRYPTION_KEY_REQUIRED",
          details: {},
        });
      }
      if (!hasComplete)
        throw new BadRequestException({
          code: "R2_CONFIGURATION_INCOMPLETE",
          details: {},
        });
      await this.testR2(dto.r2);
      try {
        await this.r2.save(dto.r2);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.startsWith("SETTINGS_ENCRYPTION_KEY") ||
            error.message === "R2_CREDENTIALS_REQUIRED")
        )
          throw new BadRequestException({ code: error.message, details: {} });
        throw error;
      }
      await this.storage.reload();
    }
    return {
      ...(await this.getAdminSettings()),
      code: "INTEGRATION_SETTINGS_UPDATED",
    };
  }

  async testR2(proposed?: R2SettingsDto) {
    if (proposed) this.validateR2(proposed);
    const proposedCompleteConfiguration = Boolean(
      proposed?.endpoint &&
      proposed.bucket &&
      proposed.accessKey &&
      proposed.secretKey,
    );
    const current = proposedCompleteConfiguration
      ? {}
      : await this.getEffectiveR2Config();
    const config = { ...current, ...(proposed ?? {}) } as Partial<R2Config>;
    this.validateR2({ endpoint: config.endpoint, bucket: config.bucket });
    if (
      !config.endpoint ||
      !config.bucket ||
      !config.accessKey ||
      !config.secretKey
    )
      throw new BadRequestException({
        code: "R2_CONFIGURATION_INCOMPLETE",
        details: {},
      });
    const client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    });
    try {
      await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
      return { code: "R2_CONNECTION_SUCCESS", details: { configured: true } };
    } catch (error) {
      throw new ServiceUnavailableException({
        code: classifyR2ConnectionError(error),
        details: { configured: true },
      });
    } finally {
      client.destroy();
    }
  }

  async getPublicConfig() {
    const phone = await this.getWhatsappPhone();
    return { whatsappUrl: phone ? this.whatsappUrl(phone) : null };
  }

  private async getEffectiveR2Config() {
    try {
      return await this.r2.getEffectiveConfig();
    } catch {
      throw new ServiceUnavailableException({
        code: "R2_CONFIGURATION_INVALID",
        details: {},
      });
    }
  }

  private async getDatabaseR2Config() {
    try {
      return await this.r2.getDatabaseConfig();
    } catch {
      throw new ServiceUnavailableException({
        code: "R2_CONFIGURATION_INVALID",
        details: {},
      });
    }
  }

  private async getWhatsappPhone(): Promise<string | null> {
    const setting = await this.prisma.companySetting.findUnique({
      where: { key: WHATSAPP_KEY },
    });
    const value = setting?.value;
    if (typeof value === "string" && this.isValidPhone(value)) return value;
    // Read the early object shape for compatibility, but validate it before
    // exposing a generated public WhatsApp URL.
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as { phone?: unknown }).phone === "string"
    ) {
      const phone = (value as { phone: string }).phone;
      return this.isValidPhone(phone) ? phone : null;
    }
    return null;
  }

  private normalizePhone(input: string): string {
    const digits = input
      .trim()
      .replace(/[\s().-]/g, "")
      .replace(/^00/, "+");
    if (!this.isValidPhone(digits))
      throw new BadRequestException({
        code: "INVALID_WHATSAPP_PHONE",
        details: {},
      });
    return digits;
  }

  private isValidPhone(phone: string): boolean {
    return /^\+[1-9]\d{7,14}$/.test(phone);
  }

  private whatsappUrl(phone: string): string {
    return `https://wa.me/${phone.slice(1)}`;
  }

  private validateR2(dto: R2SettingsDto): void {
    for (const key of ["endpoint", "publicDomain"] as const) {
      const value = dto[key];
      if (!value) continue;
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        throw new BadRequestException({
          code: "INVALID_R2_URL",
          details: { field: key },
        });
      }
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      )
        throw new BadRequestException({
          code: "INVALID_R2_URL",
          details: { field: key },
        });
      if (
        key === "endpoint" &&
        !(
          url.hostname === "cloudflarestorage.com" ||
          url.hostname.endsWith(".cloudflarestorage.com")
        )
      )
        throw new BadRequestException({
          code: "UNSAFE_R2_ENDPOINT",
          details: { field: key },
        });
      if (key === "publicDomain" && !isSafePublicDomainHost(url.hostname))
        throw new BadRequestException({
          code: "INVALID_R2_PUBLIC_DOMAIN",
          details: { field: key },
        });
    }
    if (dto.bucket && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(dto.bucket))
      throw new BadRequestException({ code: "INVALID_R2_BUCKET", details: {} });
  }
}
