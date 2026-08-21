import {
  BadRequestException,
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
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { StorageService } from "../../../common/storage/storage.service";
import { StorageCategory } from "../../../common/storage/storage.constants";
import { getSalesRequestAccessScope } from "../../requests/request-access";
import { CreateContractDto, UpdateContractDto } from "../dto/contract.dto";
import { SalesContractQueryDto } from "../dto/sales-contract-query.dto";
import { ContractsService } from "../services/contracts.service";

interface AuthUser {
  id: string;
  role?: string | null;
}

@Controller("sales/contracts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @RequirePermissions("contracts.read")
  findAll(
    @Query() filters: SalesContractQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contractsService.findSalesAll(
      filters,
      getSalesRequestAccessScope(user),
    );
  }

  @Get(":id/share-link")
  @RequirePermissions("contracts.read")
  findShareLink(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.contractsService.findSalesShareLink(
      id,
      getSalesRequestAccessScope(user),
    );
  }

  @Get(":id/detail")
  @RequirePermissions("contracts.read")
  findDetail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.contractsService.findSalesDetail(
      id,
      getSalesRequestAccessScope(user),
    );
  }

  @Get(":id")
  @RequirePermissions("contracts.read")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.contractsService.findSalesDetail(
      id,
      getSalesRequestAccessScope(user),
    );
  }

  @Post()
  @RequirePermissions("contracts.create")
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateContractDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: "PDF_FILE_REQUIRED",
        details: {},
      });
    }

    const accessScope = getSalesRequestAccessScope(user);
    await this.contractsService.assertCreationAccess(dto, accessScope);

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.CONTRACT,
      entityId: "pending",
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    return this.contractsService.create(
      user.id,
      uploadResult.key,
      dto,
      accessScope,
    );
  }

  @Patch(":id")
  @RequirePermissions("contracts.update")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contractsService.update(
      id,
      dto,
      getSalesRequestAccessScope(user),
    );
  }
}
