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
  DisputeFilterDto,
  ApproveDisputeDto,
  RejectDisputeDto,
  CloseDisputeDto,
  ChangePmDto,
  CreateDisputeMessageDto,
} from "../dto";

@Controller("admin/disputes")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("disputes.admin")
export class AdminDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  async getAllDisputes(@Query() filter: DisputeFilterDto) {
    return this.disputesService.getAllDisputes(filter);
  }

  @Get("stats")
  async getDisputeStats() {
    return this.disputesService.getAdminStats();
  }

  @Get("pm/:pmId/stats")
  async getPmStats(@Param("pmId") pmId: string) {
    return this.disputesService.getPmStats(pmId);
  }

  @Get(":id")
  async getDisputeById(@Param("id") id: string) {
    return this.disputesService.getDisputeById(id);
  }

  @Get(":id/threads")
  async getThreads(@Param("id") id: string) {
    return this.disputesService.getAdminThreads(id);
  }

  @Get(":id/threads/:threadType/messages")
  async getThreadMessages(
    @Param("id") id: string,
    @Param("threadType", new ParseEnumPipe(DisputeThreadType))
    threadType: DisputeThreadType,
  ) {
    return this.disputesService.getAdminThreadMessages(id, threadType);
  }

  @Post(":id/approve")
  async approveDispute(
    @CurrentUser("id") adminId: string,
    @Param("id") id: string,
    @Body() dto: ApproveDisputeDto,
  ) {
    return this.disputesService.approveDispute(adminId, id, dto);
  }

  @Post(":id/reject")
  async rejectDispute(
    @CurrentUser("id") adminId: string,
    @Param("id") id: string,
    @Body() dto: RejectDisputeDto,
  ) {
    return this.disputesService.rejectDispute(adminId, id, dto);
  }

  @Post(":id/change-pm")
  async changePm(
    @CurrentUser("id") adminId: string,
    @Param("id") id: string,
    @Body() dto: ChangePmDto,
  ) {
    return this.disputesService.changePm(adminId, id, dto);
  }

  @Post(":id/close")
  async closeDispute(
    @CurrentUser("id") adminId: string,
    @Param("id") id: string,
    @Body() dto: CloseDisputeDto,
  ) {
    return this.disputesService.closeDispute(adminId, id, dto);
  }

  @Post(":id/messages")
  async addMessage(
    @CurrentUser("id") adminId: string,
    @Param("id") id: string,
    @Body() dto: CreateDisputeMessageDto,
  ) {
    return this.disputesService.addAdminThreadMessage(
      adminId,
      id,
      dto.threadType ?? DisputeThreadType.ADMIN_PM,
      {
      ...dto,
      isInternal: false,
      },
    );
  }

  @Post(":id/threads/:threadType/messages")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addThreadMessage(
    @CurrentUser("id") adminId: string,
    @Param("id") id: string,
    @Param("threadType", new ParseEnumPipe(DisputeThreadType))
    threadType: DisputeThreadType,
    @Body() dto: CreateDisputeMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.disputesService.addAdminThreadMessage(
      adminId,
      id,
      threadType,
      dto,
      files,
    );
  }
}
