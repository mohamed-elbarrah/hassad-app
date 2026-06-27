import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
  NotFoundException,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { DisputesService } from "../services/disputes.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import {
  CreateDisputeDto,
  CreateDisputeMessageDto,
  ClientConfirmDto,
  DisputeFilterDto,
} from "../dto";

@Controller("portal/disputes")
@UseGuards(JwtAuthGuard)
export class PortalDisputesController {
  constructor(
    private readonly disputesService: DisputesService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveClientId(user: any): Promise<string | null> {
    if (user.clientId) return user.clientId;
    if (user.role !== "CLIENT") return null;
    // Personal identity (email) now on `User`; link via `userId`.
    const client = await this.prisma.client.findFirst({
      where: { userId: user.id },
    });
    return client?.id ?? null;
  }

  @Post()
  @UseInterceptors(FilesInterceptor("files", 5))
  async createDispute(
    @CurrentUser() user: any,
    @Body() dto: CreateDisputeDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) throw new ForbiddenException();
    return this.disputesService.createDispute(clientId, dto, files);
  }

  @Get()
  async getClientDisputes(
    @CurrentUser() user: any,
    @Query() filter: DisputeFilterDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) {
      return { data: [], meta: { total: 0, page: 1, limit: 9, totalPages: 0 } };
    }
    return this.disputesService.getClientDisputes(clientId, filter);
  }

  @Get(":id")
  async getDisputeById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) throw new NotFoundException("التذكرة غير موجودة");
    return this.disputesService.getClientDisputeById(clientId, id);
  }

  @Post(":id/messages")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addMessage(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: CreateDisputeMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.disputesService.addMessage(id, userId, dto, files);
  }

  @Post(":id/confirm")
  async confirmResolution(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: ClientConfirmDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) throw new ForbiddenException();
    return this.disputesService.clientConfirmResolution(clientId, id, dto);
  }
}
