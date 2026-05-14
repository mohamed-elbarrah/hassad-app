import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrencySettingsService } from '../services/currency-settings.service';
import { CreateCurrencySettingDto, UpdateCurrencySettingDto } from '../dto/currency-setting.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('currency-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CurrencySettingsController {
  constructor(private readonly service: CurrencySettingsService) {}

  @Get()
  @RequirePermissions('settings.read')
  findAll() {
    return this.service.findAll();
  }

  @Get('default')
  findDefault() {
    return this.service.findDefault();
  }

  @Get(':id')
  @RequirePermissions('settings.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.create')
  create(@Body() dto: CreateCurrencySettingDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.update')
  update(@Param('id') id: string, @Body() dto: UpdateCurrencySettingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.delete')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post('upload-svg')
  @RequirePermissions('settings.update')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSvg(
    @UploadedFile() file: Express.Multer.File,
    @Query('key') svgKey?: string,
  ) {
    if (!file) {
      throw new Error('SVG file is required');
    }
    const key = svgKey || file.originalname;
    return this.service.uploadSvg(file, key);
  }
}
