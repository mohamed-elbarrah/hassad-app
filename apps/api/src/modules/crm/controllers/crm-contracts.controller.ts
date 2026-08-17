import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { StorageService } from "../../../common/storage/storage.service";
import {
  CrmContractsWorkspaceQueryDto,
  CrmCreateContractDto,
  CrmUpdateContractDto,
} from "../dto/crm-contracts.dto";
import { CrmContractsService } from "../services/crm-contracts.service";

@Controller("crm/contracts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmContractsController {
  constructor(
    private readonly service: CrmContractsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @RequirePermissions("contracts.read")
  findAll(@Query() query: CrmContractsWorkspaceQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("contracts.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("contracts.create")
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CrmCreateContractDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const filePath = file
      ? (
          await this.storageService.upload({
            category: StorageCategory.CONTRACT,
            entityId: "pending",
            file: {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
          })
        ).key
      : dto.filePath;

    return this.service.create(userId, { ...dto, filePath });
  }

  @Patch(":id")
  @RequirePermissions("contracts.update")
  @UseInterceptors(FileInterceptor("file"))
  async update(
    @Param("id") id: string,
    @Body() dto: CrmUpdateContractDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const filePath = file
      ? (
          await this.storageService.upload({
            category: StorageCategory.CONTRACT,
            entityId: id,
            file: {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
          })
        ).key
      : dto.filePath;

    return this.service.update(id, { ...dto, filePath });
  }

  @Post(":id/send")
  @RequirePermissions("contracts.send")
  send(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.service.send(id, userId);
  }
}
