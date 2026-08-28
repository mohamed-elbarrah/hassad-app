import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma, SymbolType as PrismaSymbolType } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../../common/storage/storage.service";
import { CreateCurrencySettingDto, UpdateCurrencySettingDto, SymbolType } from "../dto/currency-setting.dto";
import { StorageCategory, STORAGE_CONFIG } from "../../../common/storage/storage.constants";
import { MAX_SVG_BYTES, sanitizeSvgContent } from "../../../common/security/svg-sanitizer";

const MAX_SYMBOL_DIMENSION = 512;

@Injectable()
export class CurrencySettingsService {
  constructor(private readonly prisma: PrismaService, private readonly storageService: StorageService) {}

  /** Keep durable references separate from short-lived presentation URLs. */
  private async presentSetting<T extends { symbolType: string; svgKey: string | null }>(
    setting: T,
    exposeStorageReference = true,
  ): Promise<T & { svgUrl: string | null }> {
    const { svgKey } = setting;
    if (setting.symbolType === SymbolType.TEXT) {
      return { ...setting, svgKey: null, svgUrl: null };
    }
    if (!svgKey || setting.symbolType === SymbolType.SVG_INLINE) {
      return { ...setting, svgUrl: null };
    }

    const asset = await this.prisma.currencySvg.findUnique({ where: { key: svgKey } });
    if (asset) {
      const svgUrl = await this.storageService.getPresignedUrlIfExists(asset.key);
      // Preserve compatibility for old SVG_URL records that contain a storage key.
      return {
        ...setting,
        symbolType: setting.symbolType === SymbolType.SVG_URL ? SymbolType.SVG_UPLOAD : setting.symbolType,
        svgKey: exposeStorageReference ? svgKey : null,
        svgUrl,
      };
    }

    // External URLs are already presentation-safe and do not need signing.
    if (setting.symbolType === SymbolType.SVG_URL && /^(https?):\/\//i.test(svgKey)) {
      return { ...setting, svgKey: exposeStorageReference ? svgKey : null, svgUrl: svgKey };
    }

    return { ...setting, svgKey: exposeStorageReference ? svgKey : null, svgUrl: null };
  }

  async findAll() {
    const settings = await this.prisma.currencySetting.findMany({ orderBy: { createdAt: "asc" } });
    return Promise.all(settings.map((setting) => this.presentSetting(setting)));
  }
  async findDefault() {
    const setting = await this.prisma.currencySetting.findFirst({ where: { isDefault: true, isActive: true } });
    return setting ? this.presentSetting(setting, false) : null;
  }
  async findOne(id: string) {
    const setting = await this.prisma.currencySetting.findUnique({ where: { id } });
    if (!setting) throw new NotFoundException({ code: "CURRENCY_NOT_FOUND", details: {} });
    return this.presentSetting(setting);
  }

  private toPrismaSymbolType(symbolType?: SymbolType): PrismaSymbolType | undefined {
    return symbolType === undefined ? undefined : PrismaSymbolType[symbolType];
  }

  private normalizeSvg<T extends CreateCurrencySettingDto | UpdateCurrencySettingDto>(
    dto: T,
    effectiveSymbolType = dto.symbolType ?? SymbolType.TEXT,
    effectiveSvgKey = dto.svgKey,
  ): T {
    for (const dimension of [dto.svgWidth, dto.svgHeight]) {
      if (dimension !== undefined && (!Number.isInteger(dimension) || dimension < 1 || dimension > MAX_SYMBOL_DIMENSION)) {
        throw new BadRequestException({ code: "SVG_DIMENSIONS_INVALID", details: { max: MAX_SYMBOL_DIMENSION } });
      }
    }

    // A source has meaning only for its selected representation. In particular,
    // never preserve an arbitrary value when the type is TEXT (including the
    // create case where symbolType was omitted).
    if (effectiveSymbolType === SymbolType.TEXT) {
      dto.symbolType = SymbolType.TEXT;
      dto.svgKey = null;
      return dto;
    }

    if (effectiveSymbolType === SymbolType.SVG_INLINE) {
      if (typeof effectiveSvgKey !== "string" || !effectiveSvgKey.trim()) {
        throw new BadRequestException({ code: "SVG_CONTENT_REQUIRED", details: {} });
      }
      dto.svgKey = sanitizeSvgContent(effectiveSvgKey);
      return dto;
    }

    if (effectiveSymbolType === SymbolType.SVG_URL) {
      if (typeof effectiveSvgKey !== "string" || !effectiveSvgKey.trim()) {
        throw new BadRequestException({ code: "SVG_URL_INVALID", details: {} });
      }
      let url: URL;
      try {
        url = new URL(effectiveSvgKey.trim());
      } catch {
        throw new BadRequestException({ code: "SVG_URL_INVALID", details: {} });
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new BadRequestException({ code: "SVG_URL_UNSAFE", details: {} });
      }
      if (url.username || url.password) {
        throw new BadRequestException({ code: "SVG_URL_UNSAFE", details: {} });
      }
      dto.svgKey = url.toString();
      return dto;
    }

    if (typeof effectiveSvgKey !== "string" || !effectiveSvgKey.trim()) {
      throw new BadRequestException({ code: "SVG_REFERENCE_REQUIRED", details: {} });
    }
    if (/^(https?:\/\/|data:|javascript:|vbscript:)/i.test(effectiveSvgKey.trim())) {
      throw new BadRequestException({ code: "SVG_REFERENCE_INVALID", details: {} });
    }
    dto.svgKey = effectiveSvgKey.trim();
    return dto;
  }

  private async assertRegisteredSvgReference(
    key: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const asset = await prisma.currencySvg.findUnique({ where: { key } });
    const prefix = `${STORAGE_CONFIG[StorageCategory.CURRENCY_SVG].keyPrefix}/`;
    if (!asset || asset.path !== key || !asset.key.startsWith(prefix) || asset.mimetype !== "image/svg+xml" || !asset.isCleaned) {
      throw new BadRequestException({ code: "SVG_REFERENCE_NOT_REGISTERED", details: {} });
    }
  }

  private async releaseSvgIfUnused(key: string | null, excludingCurrencyId?: string): Promise<void> {
    if (!key) return;
    const remaining = await this.prisma.currencySetting.count({
      where: { svgKey: key, ...(excludingCurrencyId ? { id: { not: excludingCurrencyId } } : {}) },
    });
    if (remaining > 0) return;
    const asset = await this.prisma.currencySvg.findUnique({ where: { key } });
    if (!asset) return;
    await this.prisma.currencySvg.delete({ where: { key } });
    await this.storageService.deleteByKey(key);
  }

  async create(dto: CreateCurrencySettingDto) {
    this.normalizeSvg(dto);
    const setting = await this.prisma.$transaction(async (tx) => {
      if (dto.symbolType === SymbolType.SVG_UPLOAD) await this.assertRegisteredSvgReference(dto.svgKey!, tx);
      if (dto.isDefault) {
        await tx.currencySetting.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
      }
      return tx.currencySetting.create({ data: { ...dto, symbolType: this.toPrismaSymbolType(dto.symbolType) } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return this.presentSetting(setting);
  }

  async update(id: string, dto: UpdateCurrencySettingDto) {
    const exists = await this.prisma.currencySetting.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException({ code: "CURRENCY_NOT_FOUND", details: {} });
    let effectiveSymbolType = dto.symbolType ?? (exists.symbolType as SymbolType);
    const changingSymbolType = dto.symbolType !== undefined && dto.symbolType !== exists.symbolType;
    // Do not carry a reference/content across representation changes. A TEXT
    // setting is also normalized below even when its old database value is bad.
    if (changingSymbolType && dto.svgKey === undefined) dto.svgKey = null;
    const effectiveSvgKey = dto.svgKey !== undefined ? dto.svgKey : exists.svgKey;
    // Older SVG_URL rows could contain a private storage key. Keep those
    // records editable by applying the same compatibility normalization used
    // when presenting them.
    if (effectiveSymbolType === SymbolType.SVG_URL && effectiveSvgKey) {
      const legacyAsset = await this.prisma.currencySvg.findUnique({ where: { key: effectiveSvgKey } });
      if (legacyAsset) {
        effectiveSymbolType = SymbolType.SVG_UPLOAD;
        dto.symbolType = SymbolType.SVG_UPLOAD;
      }
    }
    this.normalizeSvg(dto, effectiveSymbolType, effectiveSvgKey);
    const setting = await this.prisma.$transaction(async (tx) => {
      if (effectiveSymbolType === SymbolType.SVG_UPLOAD && effectiveSvgKey) {
        await this.assertRegisteredSvgReference(effectiveSvgKey, tx);
      }
      if (dto.isDefault) {
        await tx.currencySetting.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
      }
      return tx.currencySetting.update({ where: { id }, data: { ...dto, symbolType: this.toPrismaSymbolType(dto.symbolType) } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (exists.svgKey && exists.svgKey !== setting.svgKey) {
      await this.releaseSvgIfUnused(exists.svgKey, id);
    }
    return this.presentSetting(setting);
  }

  async delete(id: string) {
    const exists = await this.prisma.currencySetting.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException({ code: "CURRENCY_NOT_FOUND", details: {} });
    if (exists.isDefault) throw new BadRequestException({ code: "DEFAULT_CURRENCY_CANNOT_BE_DELETED", details: {} });
    await this.prisma.currencySetting.delete({ where: { id } });
    await this.releaseSvgIfUnused(exists.svgKey);
    return { id };
  }

  async uploadSvg(file: Express.Multer.File): Promise<{ url: string; reference: string; isCleaned: boolean }> {
    const hasSvgExtension = /\.svg$/i.test(file?.originalname ?? "");
    const hasSvgMime = file?.mimetype === "image/svg+xml";
    // MIME is client-controlled and may be empty/non-standard; content safety
    // is enforced below by sanitizeSvgContent.
    if (!file?.buffer || (!hasSvgExtension && !hasSvgMime)) throw new BadRequestException({ code: "SVG_TYPE_NOT_ALLOWED", details: { expected: "image/svg+xml" } });
    if (file.buffer.length > MAX_SVG_BYTES) throw new BadRequestException({ code: "SVG_TOO_LARGE", details: { maxBytes: MAX_SVG_BYTES } });
    const cleaned = sanitizeSvgContent(file.buffer.toString("utf8"));
    const cleanedBuffer = Buffer.from(cleaned, "utf8");
    const result = await this.storageService.upload({
      category: StorageCategory.CURRENCY_SVG,
      entityId: "currency",
      file: { buffer: cleanedBuffer, originalname: "currency.svg", mimetype: "image/svg+xml", size: cleanedBuffer.length },
    });
    try {
      await this.prisma.currencySvg.create({ data: { key: result.key, filename: "currency.svg", mimetype: "image/svg+xml", size: cleanedBuffer.length, path: result.key, isCleaned: true } });
    } catch (error) {
      await this.storageService.deleteByKey(result.key);
      throw error;
    }
    return { url: result.url, reference: result.key, isCleaned: true };
  }
}
