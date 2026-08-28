import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileValidationPipe } from "../../../common/storage/file-validator.pipe";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { MAX_SVG_BYTES } from "../../../common/security/svg-sanitizer";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { CurrencySettingsService } from "../../settings/services/currency-settings.service";
import {
  CreateCurrencySettingDto,
  UpdateCurrencySettingDto,
} from "../../settings/dto/currency-setting.dto";

@Controller("admin/settings/currencies")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin.settings")
export class AdminCurrencySettingsController {
  constructor(private readonly service: CurrencySettingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCurrencySettingDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCurrencySettingDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.delete(id);
  }

  @Post("upload-svg")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_SVG_BYTES } }))
  uploadSvg(
    @UploadedFile(new FileValidationPipe({ category: StorageCategory.CURRENCY_SVG })) file: Express.Multer.File,
  ) {
    return this.service.uploadSvg(file);
  }
}
