import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseEnumPipe,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { DisputeThreadType } from "@prisma/client";
import { DisputesService } from "../services/disputes.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../common/guards/permissions.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  CreateDisputeMessageDto,
  DisputeFilterDto,
  PmResolveDto,
} from "../dto";

@Controller("pm/disputes")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("disputes.pm_read")
export class PmDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  async getPmDisputes(
    @CurrentUser("id") pmId: string,
    @Query() filter: DisputeFilterDto,
  ) {
    return this.disputesService.getPmDisputes(pmId, filter);
  }

  @Get("stats")
  async getPmStats(@CurrentUser("id") pmId: string) {
    return this.disputesService.getPmStats(pmId);
  }

  @Get(":id/workspace")
  async getDisputeWorkspace(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
  ) {
    return this.disputesService.getPmDisputeWorkspace(pmId, id);
  }

  @Get(":id")
  async getDisputeById(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
  ) {
    return this.disputesService.getPmDisputeById(pmId, id);
  }

  @Get(":id/threads")
  async getThreads(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
  ) {
    return this.disputesService.getPmThreads(pmId, id);
  }

  @Get(":id/threads/:threadType/messages")
  async getThreadMessages(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
    @Param("threadType", new ParseEnumPipe(DisputeThreadType))
    threadType: DisputeThreadType,
  ) {
    return this.disputesService.getPmThreadMessages(pmId, id, threadType);
  }

  @Post(":id/acknowledge")
  @RequirePermissions("disputes.pm_update")
  async acknowledgeDispute(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
  ) {
    return this.disputesService.pmAcknowledge(pmId, id);
  }

  @Post(":id/messages")
  @RequirePermissions("disputes.pm_update")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addMessage(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
    @Body() dto: CreateDisputeMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.disputesService.addPmThreadMessage(
      pmId,
      id,
      DisputeThreadType.CLIENT_PM,
      { ...dto, isInternal: false, threadType: DisputeThreadType.CLIENT_PM },
      files,
    );
  }

  @Post(":id/threads/:threadType/messages")
  @RequirePermissions("disputes.pm_update")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addThreadMessage(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
    @Param("threadType", new ParseEnumPipe(DisputeThreadType))
    threadType: DisputeThreadType,
    @Body() dto: CreateDisputeMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.disputesService.addPmThreadMessage(
      pmId,
      id,
      threadType,
      { ...dto, isInternal: false, threadType },
      files,
    );
  }

  @Post(":id/resolve")
  @RequirePermissions("disputes.pm_update")
  async resolveDispute(
    @CurrentUser("id") pmId: string,
    @Param("id") id: string,
    @Body() dto: PmResolveDto,
  ) {
    return this.disputesService.pmResolve(pmId, id, dto);
  }
}
