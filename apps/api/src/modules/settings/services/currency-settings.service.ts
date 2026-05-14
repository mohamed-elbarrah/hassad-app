import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../common/storage/storage.service';
import { CreateCurrencySettingDto, UpdateCurrencySettingDto } from '../dto/currency-setting.dto';
import { StorageCategory } from '../../../common/storage/storage.constants';

function cleanSvgContent(svg: string): string {
  // Remove <script> tags (with and without namespace)
  let cleaned = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Remove event handlers
  cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  // Remove href / xlink:href that could be javascript: / data:
  cleaned = cleaned.replace(/\shref\s*=\s*["']javascript:[^"]*["']/gi, '');
  cleaned = cleaned.replace(/\sxlink:href\s*=\s*["']javascript:[^"]*["']/gi, '');
  // Remove foreignObject, iframe, object, embed, link tags (possibly namespaced)
  cleaned = cleaned.replace(/<\w*:\s*(foreignObject|iframe|object|embed|link)[\s\S]*?<\/\w*:\s*\1>/gi, '');
  cleaned = cleaned.replace(/<(foreignObject|iframe|object|embed|link)[\s\S]*?<\/\1>/gi, '');
  return cleaned.trim();
}

@Injectable()
export class CurrencySettingsService {
  private readonly logger = new Logger(CurrencySettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll() {
    return this.prisma.currencySetting.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findDefault() {
    const setting = await this.prisma.currencySetting.findFirst({
      where: { isDefault: true, isActive: true },
    });
    return setting;
  }

  async findOne(id: string) {
    const setting = await this.prisma.currencySetting.findUnique({ where: { id } });
    if (!setting) throw new NotFoundException('Currency setting not found');
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
    const exists = await this.prisma.currencySetting.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Currency setting not found');

    if (dto.isDefault) {
      await this.prisma.currencySetting.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.currencySetting.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const exists = await this.prisma.currencySetting.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Currency setting not found');
    if (exists.isDefault) {
      throw new BadRequestException('Cannot delete the default currency setting');
    }
    return this.prisma.currencySetting.delete({ where: { id } });
  }

  async uploadSvg(
    file: Express.Multer.File,
    svgKey: string,
  ): Promise<{ key: string; url: string; isCleaned: boolean }> {
    const raw = file.buffer.toString('utf-8');
    const cleaned = cleanSvgContent(raw);
    const cleanedBuffer = Buffer.from(cleaned, 'utf-8');

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.CURRENCY_SVG,
      entityId: svgKey,
      file: {
        buffer: cleanedBuffer,
        originalname: file.originalname,
        mimetype: 'image/svg+xml',
        size: cleanedBuffer.length,
      },
    });

    await this.prisma.currencySvg.create({
      data: {
        key: uploadResult.key,
        filename: file.originalname,
        mimetype: 'image/svg+xml',
        size: cleanedBuffer.length,
        path: uploadResult.url,
        isCleaned: true,
      },
    });

    return { key: uploadResult.key, url: uploadResult.url, isCleaned: true };
  }
}
