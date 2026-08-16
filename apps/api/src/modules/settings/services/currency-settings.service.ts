import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { StorageService } from "../../../common/storage/storage.service";
import {
  CreateCurrencySettingDto,
  UpdateCurrencySettingDto,
  SymbolType,
} from "../dto/currency-setting.dto";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { cleanSvgContent } from "../../../common/security/svg-sanitizer";

@Injectable()
export class CurrencySettingsService {
  private readonly logger = new Logger(CurrencySettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async withSvgPreview<T extends { svgKey: string | null }>(settings: T[]) {
    const keys = settings.map((setting) => setting.svgKey).filter(Boolean) as string[];
    if (keys.length === 0) return settings;

    const svgs = await this.prisma.currencySvg.findMany({ where: { key: { in: keys } }, select: { key: true, path: true } });
    const paths = new Map(svgs.map((svg) => [svg.key, svg.path]));
    return settings.map((setting) => ({ ...setting, svgUrl: setting.svgKey ? paths.get(setting.svgKey) ?? null : null }));
  }

  private validateSymbolConfiguration(dto: { symbol?: string; symbolType?: string; svgKey?: string }) {
    if (!dto.symbol?.trim()) throw new BadRequestException("Currency symbol is required");
    if (dto.symbolType === SymbolType.SVG_INLINE && !dto.svgKey?.trim()) {
      throw new BadRequestException("Inline SVG content is required");
    }
    if (dto.symbolType === SymbolType.SVG_URL && !dto.svgKey?.trim()) {
      throw new BadRequestException("An SVG upload is required");
    }
  }

  async findAll() {
    const settings = await this.prisma.currencySetting.findMany({ orderBy: { createdAt: "asc" } });
    return this.withSvgPreview(settings);
  }

  async findDefault() {
    const setting = await this.prisma.currencySetting.findFirst({
      where: { isDefault: true, isActive: true },
    });
    return setting;
  }

  async findOne(id: string) {
    const setting = await this.prisma.currencySetting.findUnique({
      where: { id },
    });
    if (!setting) throw new NotFoundException("Currency setting not found");
    const [result] = await this.withSvgPreview([setting]);
    return result;
  }

  async create(dto: CreateCurrencySettingDto) {
    this.validateSymbolConfiguration(dto);
    if (dto.isDefault && dto.isActive === false) {
      throw new BadRequestException("The default currency must be active");
    }
    if (dto.isDefault) {
      await this.prisma.currencySetting.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.currencySetting.create({ data: dto });
  }

  async update(id: string, dto: UpdateCurrencySettingDto) {
    const exists = await this.prisma.currencySetting.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException("Currency setting not found");

    this.validateSymbolConfiguration({
      symbol: dto.symbol ?? exists.symbol,
      symbolType: dto.symbolType ?? exists.symbolType,
      svgKey: dto.svgKey ?? exists.svgKey ?? undefined,
    });
    if (dto.isDefault && dto.isActive === false) {
      throw new BadRequestException("The default currency must be active");
    }
    if (dto.isDefault) {
      await this.prisma.currencySetting.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    if (dto.isActive === false && exists.isDefault) {
      throw new BadRequestException("The default currency must remain active");
    }
    return this.prisma.currencySetting.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const exists = await this.prisma.currencySetting.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException("Currency setting not found");
    if (exists.isDefault) {
      throw new BadRequestException(
        "Cannot delete the default currency setting",
      );
    }
    return this.prisma.currencySetting.delete({ where: { id } });
  }

  async uploadSvg(
    file: Express.Multer.File,
    svgKey: string,
  ): Promise<{ key: string; url: string; isCleaned: boolean }> {
    const raw = file.buffer.toString("utf-8");
    const cleaned = cleanSvgContent(raw);
    const cleanedBuffer = Buffer.from(cleaned, "utf-8");

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.CURRENCY_SVG,
      entityId: svgKey,
      file: {
        buffer: cleanedBuffer,
        originalname: file.originalname,
        mimetype: "image/svg+xml",
        size: cleanedBuffer.length,
      },
    });

    await this.prisma.currencySvg.create({
      data: {
        key: uploadResult.key,
        filename: file.originalname,
        mimetype: "image/svg+xml",
        size: cleanedBuffer.length,
        path: uploadResult.url,
        isCleaned: true,
      },
    });

    return { key: uploadResult.key, url: uploadResult.url, isCleaned: true };
  }
}
