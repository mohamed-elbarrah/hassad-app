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
import { RequestsService } from "../../requests/requests.service";
import { CreateProposalDto, UpdateProposalDto } from "../dto/proposal.dto";
import { ProposalQueryDto } from "../dto/proposal-query.dto";
import { ProposalsService } from "../services/proposals.service";

interface AuthUser {
  id: string;
  role?: string | null;
}

@Controller("sales/proposals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesProposalsController {
  constructor(
    private readonly proposalsService: ProposalsService,
    private readonly requestsService: RequestsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @RequirePermissions("proposals.read")
  findAll(@Query() filters: ProposalQueryDto, @CurrentUser() user: AuthUser) {
    return this.proposalsService.findSalesAll(
      filters,
      getSalesRequestAccessScope(user),
    );
  }

  @Get(":id/detail")
  @RequirePermissions("proposals.read")
  findSalesDetail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.proposalsService.findSalesDetail(
      id,
      getSalesRequestAccessScope(user),
    );
  }

  @Get(":id")
  @RequirePermissions("proposals.read")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.proposalsService.findSalesDetail(
      id,
      getSalesRequestAccessScope(user),
    );
  }

  @Post()
  @RequirePermissions("proposals.create")
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProposalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: "PDF_FILE_REQUIRED",
        details: {},
      });
    }

    const accessScope = getSalesRequestAccessScope(user);
    await this.requestsService.assertRequestAccess(dto.requestId, accessScope);

    const uploadResult = await this.storageService.upload({
      category: StorageCategory.PROPOSAL,
      entityId: "pending",
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    return this.proposalsService.create(
      user.id,
      { ...dto, filePath: uploadResult.key },
      accessScope,
    );
  }

  @Patch(":id")
  @RequirePermissions("proposals.update")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.proposalsService.update(
      id,
      dto,
      user.id,
      getSalesRequestAccessScope(user),
    );
  }
}
