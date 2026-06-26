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

  async findAll() {
    return this.prisma.currencySetting.findMany({
      orderBy: { createdAt: "asc" },
    });
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
    return setting;
  }

  async create(dto: CreateCurrencySettingDto) {
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

    if (dto.isDefault) {
      await this.prisma.currencySetting.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
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
