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
import { MarketingStrategyService } from "../services/marketing-strategy.service";
import { ApiException } from "../../../common/errors/api-error";
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
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new ApiException("STRATEGY_PDF_REQUIRED", "A PDF file is required", 400);
    }

    if (file.mimetype !== "application/pdf") {
      throw new ApiException("STRATEGY_PDF_INVALID", "File must be a PDF", 400);
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

    return this.strategyService.create(
      taskId,
      {
        key: uploadResult.key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
      user.id,
    );
  }

  @Get(":taskId/marketing-strategy")
  @RequirePermissions("marketing.read")
  findByTask(@Param("taskId") taskId: string) {
    return this.strategyService.findByTask(taskId);
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
  findOne(@Param("id") id: string) {
    return this.strategyService.findOne(id);
  }

  @Get(":id/download")
  @RequirePermissions("marketing.read")
  async download(@Param("id") id: string) {
    const url = await this.strategyService.getDownloadUrl(id);
    return { url };
  }

  @Patch(":id/send")
  @RequirePermissions("marketing.update")
  sendToClient(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() _dto: SendStrategyDto,
  ) {
    return this.strategyService.sendToClient(id, user.id);
  }

  @Post(":id/resubmit")
  @RequirePermissions("marketing.update")
  @UseInterceptors(FileInterceptor("file"))
  async resubmit(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new ApiException("STRATEGY_PDF_REQUIRED", "A PDF file is required", 400);
    }

    if (file.mimetype !== "application/pdf") {
      throw new ApiException("STRATEGY_PDF_INVALID", "File must be a PDF", 400);
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

    return this.strategyService.resubmit(
      id,
      {
        key: uploadResult.key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
      user.id,
    );
  }
}
