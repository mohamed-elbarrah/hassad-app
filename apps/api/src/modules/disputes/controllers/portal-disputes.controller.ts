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
} from "@nestjs/common";
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
    const client = await this.prisma.client.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
    });
    return client?.id ?? null;
  }

  @Post()
  async createDispute(
    @CurrentUser() user: any,
    @Body() dto: CreateDisputeDto,
  ) {
    const clientId = await this.resolveClientId(user);
    if (!clientId) throw new ForbiddenException();
    return this.disputesService.createDispute(clientId, dto);
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
  async addMessage(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: CreateDisputeMessageDto,
  ) {
    return this.disputesService.addMessage(id, userId, dto);
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
