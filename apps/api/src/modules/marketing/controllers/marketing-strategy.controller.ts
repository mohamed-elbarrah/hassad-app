import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileValidationPipe } from "../../../common/storage/file-validator.pipe";
import { MarketingStrategyService } from "../services/marketing-strategy.service";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import {
  SendStrategyDto,
  ClientApproveStrategyDto,
  ClientRequestRevisionDto,
  StrategyQueryDto,
} from "../dto/marketing-strategy.dto";
import { MarketingStrategyStatus } from "@hassad/shared";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { JwtPayload } from "../../../common/decorators/current-user.decorator";

@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskMarketingStrategyController {
  constructor(
    private readonly strategyService: MarketingStrategyService,
    private readonly storageService: StorageService,
  ) {}

  @Post(":taskId/marketing-strategy")
  @RequirePermissions("marketing.create")
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @Param("taskId") taskId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new FileValidationPipe({ category: StorageCategory.MARKETING_STRATEGY }),
    )
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: "FILE_TYPE_NOT_ALLOWED",
        details: {},
      });
    }

    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException({
        code: "FILE_TYPE_NOT_ALLOWED",
        details: {},
      });
    }

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.MARKETING_STRATEGY,
      entityId: taskId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    try {
      return await this.strategyService.create(
        taskId,
        {
          key: uploadResult.key,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
        user.id,
      );
    } catch (error) {
      await this.storageService.deleteByKey(uploadResult.key).catch(() => {});
      throw error;
    }
  }

  @Get(":taskId/marketing-strategy")
  @RequirePermissions("marketing.read")
  findByTask(@Param("taskId") taskId: string, @CurrentUser() user: JwtPayload) {
    return this.strategyService.findByTask(taskId, user.id);
  }
}

@Controller("marketing-strategies")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketingStrategiesController {
  constructor(
    private readonly strategyService: MarketingStrategyService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @RequirePermissions("marketing.read")
  findAll(@Query() query: StrategyQueryDto) {
    return this.strategyService.findAll(query);
  }

  @Get(":id")
  @RequirePermissions("marketing.read")
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.strategyService.findOne(id, user.id);
  }

  @Get(":id/download")
  @RequirePermissions("marketing.read")
  async download(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    const url = await this.strategyService.getDownloadUrl(id, user.id);
    return { url };
  }

  @Patch(":id/submit-pm")
  @RequirePermissions("marketing.update")
  submitForPm(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() _dto: SendStrategyDto,
  ) {
    return this.strategyService.submitForPm(id, user.id);
  }

  /** Legacy alias retained for existing integrations; it now submits to PM review. */
  @Patch(":id/send")
  @RequirePermissions("marketing.update")
  legacySubmitForPm(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.strategyService.submitForPm(id, user.id);
  }

  @Post(":id/resubmit")
  @RequirePermissions("marketing.update")
  @UseInterceptors(FileInterceptor("file"))
  async resubmit(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new FileValidationPipe({ category: StorageCategory.MARKETING_STRATEGY }),
    )
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: "FILE_TYPE_NOT_ALLOWED",
        details: {},
      });
    }

    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException({
        code: "FILE_TYPE_NOT_ALLOWED",
        details: {},
      });
    }

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.MARKETING_STRATEGY,
      entityId: id,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    try {
      return await this.strategyService.resubmit(
        id,
        {
          key: uploadResult.key,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
        user.id,
      );
    } catch (error) {
      await this.storageService.deleteByKey(uploadResult.key).catch(() => {});
      throw error;
    }
  }
}
