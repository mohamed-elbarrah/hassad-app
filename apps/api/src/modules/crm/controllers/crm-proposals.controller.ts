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

import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { StorageService } from "../../../common/storage/storage.service";
import {
  CrmCreateProposalDto,
  CrmProposalsWorkspaceQueryDto,
  CrmUpdateProposalDto,
} from "../dto/crm-proposals.dto";
import { CrmProposalsService } from "../services/crm-proposals.service";

@Controller("crm/proposals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmProposalsController {
  constructor(
    private readonly service: CrmProposalsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @RequirePermissions("proposals.read")
  findAll(@Query() query: CrmProposalsWorkspaceQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("proposals.read")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions("proposals.create")
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CrmCreateProposalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const filePath = file
      ? (
          await this.storageService.upload({
            category: StorageCategory.PROPOSAL,
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
  @RequirePermissions("proposals.update")
  @UseInterceptors(FileInterceptor("file"))
  async update(
    @Param("id") id: string,
    @Body() dto: CrmUpdateProposalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const filePath = file
      ? (
          await this.storageService.upload({
            category: StorageCategory.PROPOSAL,
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
  @RequirePermissions("proposals.send")
  send(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.service.send(id, userId);
  }
}
